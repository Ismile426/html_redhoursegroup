# F&O API payload guide — keys, arrays, and Pimcore mapping

This document explains **why each API is shaped the way it is** (objects, arrays, match keys) and **where each field lands in Pimcore**. For copy-paste curl steps, see [FO_MANUAL_TEST_RUNBOOK.md](FO_MANUAL_TEST_RUNBOOK.md). For exact samples and rules, see [FO_API.html](FO_API.html).

---

## 1. Shared design (all write APIs)

### 1.1 Why `{ "batchId", "items": [ ... ] }`?

| Piece | Type | Why it exists |
|-------|------|----------------|
| **`batchId`** | string, optional | Correlates one Function run in logs and in the JSON reply. Same id on retry helps you spot duplicates. Also accepted from header `X-Batch-Id`. |
| **`items`** | **array of objects** | F&O sends **many rows per HTTP call** (up to 500). Each object is one logical upsert. Pimcore returns **one result row per processed key**, not one status for the whole HTTP request. |
| **Bare array** | `[ {...}, {...} ]` | Also accepted: equivalent to `items` when you omit the wrapper. |

**Why arrays, not one big object?**  
A map keyed by id would force the whole catalogue into one JSON document. Arrays match how D365/export batches work, keep payloads stream-friendly, and let **partial success**: row 3 can fail while rows 1–2 and 4–500 still apply.

### 1.2 Match keys (never Pimcore numeric ids)

| Rule | Reason |
|------|--------|
| Upsert by **business key** (`companyCode`, `categoryKey`, `itemNumber`, …) | F&O and Pimcore can be rebuilt independently; ids would break on every restore. |
| **Omit field** = keep stored value | Delta feeds only send what changed. |
| **`null` / `""` / whitespace** = clear | Distinct from omit. |
| **`isDeleted: true`** = unpublish | No hard delete for feed-owned objects (except attribute-only clear on `/product-attributes`). |

### 1.3 Reply shape (every write)

```json
{
  "ok": true,
  "batchId": "...",
  "processed": 2,
  "failed": 0,
  "results": [ { "key": "...", "action": "created|updated|unchanged|skipped|failed", ... } ],
  "errors": [ { "key": "...", "code": "NOT_FOUND", "retryable": true, "error": "..." } ]
}
```

- **`ok`** is `true` only when **`failed === 0`**. A **skip** (e.g. unknown company code) is not a failure.
- Use **`code`** + **`retryable`** for retry logic, not the English `error` text.

---

## 2. GET/POST `/auth` and `/ping`

| | `/auth` | `/ping` |
|---|---------|---------|
| **Purpose** | Prove the API key is valid. | Prove reachability; optionally store a sample body for debugging. |
| **Body** | None required. | Any JSON (optional). |
| **Why no `items[]`** | No catalogue write. | Ping is diagnostic, not part of the product model. |
| **Pimcore** | Nothing. | **`FoIntakeLog`** under **`/ErpIntake/{timestamp-or-key}`** — raw JSON only. Does **not** create companies or products. |

---

## 3. POST `/companies`

### 3.1 Purpose

Register **legal entities** F&O knows about. This is **not** shop release and **not** storefront bricks on SKUs.

### 3.2 Shape

```json
{
  "batchId": "...",
  "items": [
    { "companyCode": "RH", "name": "Red Horse A/S", "isDeleted": false }
  ]
}
```

**Why one object per company in `items[]`?**  
Each company is upserted independently; allow-list skips (GXN, DH, …) affect only that row.

### 3.3 Keys

| Key | Required | Why / meaning | Maps to Pimcore |
|-----|----------|---------------|-----------------|
| **`companyCode`** | Yes | Stable F&O identifier; **match key**. | `PtLegalEntity.code` |
| **`name`** | No | Display name in admin. | `PtLegalEntity.name` (input) |
| **`isDeleted`** | No | Soft unpublish. | Object unpublished flag |

**Path:** `/ErpSync/LegalEntities/{companyCode}`  
**Class:** `PtLegalEntity`

**Allow-list (today):** create `RH`, `RHU`, `ASW`, `SPI`; skip others without failing the batch.

---

## 4. POST `/dimensions`

### 4.1 Purpose

Maintain **variant axis values**: configuration, colour, size, style. Variants on `/products` point at these by **code**. Labels come from **`name`** here so the shop shows “RAL 1003”, not bare `59`.

### 4.2 Shape — why `items[]` then `values[]`?

```json
{
  "items": [
    {
      "dimension": "colour",
      "values": [
        { "code": "59", "name": "RAL 1003", "isDeleted": false }
      ]
    }
  ]
}
```

| Level | Why |
|-------|-----|
| **`items[]`** | One row per **axis** (`config`, `colour`, `size`, `style`) in the batch. |
| **`values[]`** | Many lookup values per axis in one POST (all colours in one item). |

**Result keys** are flattened to **`dimension:code`** (e.g. `colour:59`) so each value has one result line.

### 4.3 Keys

| Key | Required | Why | Maps to Pimcore |
|-----|----------|-----|-----------------|
| **`dimension`** | Yes | Chooses lookup class. | `config`→`PtConfigOption`, `colour`→`PtColourOption`, `size`→`PtSizeOption`, `style`→`PtStyleOption` |
| **`values[].code`** | Yes | **Match key**; same string on variant row in `/products`. | Object `code` |
| **`values[].name`** | Yes | Human label. | Object `name` |
| **`values[].isDeleted`** | No | Unpublish that lookup value. | Published flag |

**Path:** `/ErpSync/DimOptions/{ClassName}/{code}`  
**Note:** `code` is **unique class-wide**. Workshop-owned codes are reused → result `skipped` / `WORKSHOP_OWNED` (name not overwritten).

This is **not** the attribute-setup group named `DIMENSIONS` on `/attribute-definitions`.

---

## 5. POST `/tree`

### 5.1 Purpose

Create the **five folder levels** that products hang from. Does **not** create masters, variants, or attribute values.

### 5.2 Shape — why one object per folder?

```json
{
  "items": [
    { "categoryKey": "5637144580", "parentKey": null, "level": 1, "productType": "06", "name": "Screws" },
    { "categoryKey": "5637144712", "parentKey": "5637144580", "level": 2, "name": "CREO", "brand": "CREO" }
  ]
}
```

| Design choice | Why |
|---------------|-----|
| **`items[]` = one folder each** | F&O sends one record per hierarchy node; parent/child order matters inside the batch. |
| **`categoryKey`** as match key | F&O record id — must stay stable; changing it creates a **second** folder and orphans children. |
| **`parentKey`** | Builds the tree; Pimcore does not infer skipped levels. |
| **`level` 1–5** | Maps to `layer`: type, family, series, range, productGroup. |
| **`productType` only on L1** | `06` → class `PtScrew`, `09` → `PtWasher`; children inherit. |

### 5.3 Keys (selected)

| Key | Level | Maps to |
|-----|-------|---------|
| **`categoryKey`** | all | `code` on folder object |
| **`parentKey`** | child | Parent folder’s `categoryKey` |
| **`name`** | all | Folder `name` |
| **`brand`** | 2 | `brand` relation → `PtBrand` (by code) |
| **`productGroupNumber`** | 5 | `productGroupNumber` input |
| **`texts[]`** | all | Accepted; **not stored** in v1 (folder labels ≠ product translations) |
| **`isDeleted`** | all | Unpublish folder |

**Path:** `/ErpSync/Catalog/...` nested folders, all **`PtScrew`** or **`PtWasher`** with appropriate `layer`.

---

## 6. POST `/attribute-definitions`

### 6.1 Purpose

**Setup only** (when definitions change): what attributes exist, how they are grouped, and **which tree folder (`categoryKey`) uses which groups**. Does **not** set values on products.

### 6.2 Shape — why three arrays inside **one** `items[]` object?

```json
{
  "items": [{
    "attributes": [ { "code": "RH_Head", "dataType": "list", "options": [...] } ],
    "groups": [ { "code": "SHAPE", "attributes": ["RH_Head"] } ],
    "folderGroups": [ { "categoryKey": "5637145021", "groups": ["SHAPE"] } ]
  }]
}
```

| Array | Why separate |
|-------|----------------|
| **`attributes[]`** | Global catalogue of attribute **codes**, types, units, option lists, labels (`texts[]`). Stored once in the book. |
| **`groups[]`** | Named bundles of attribute codes (Shape, Dimensions, …) — how F&O thinks in UI groups. |
| **`folderGroups[]`** | **Placement**: which **folder** in the tree uses which groups → drives `/product-attributes` branch behaviour. |

**Why not one flat list?**  
Definitions are reused across many folders and products. Splitting **definition**, **grouping**, and **folder assignment** avoids sending the full attribute dictionary on every product row.

**Why often a single element in `items[]`?**  
One POST can carry the whole setup document; multiple `items[]` entries are allowed for partial updates in the same batch.

### 6.3 Attribute object keys

| Key | Why | Stored in |
|-----|-----|-----------|
| **`code`** | Sent again on `/product-attributes` as `attributeCode`. | Book `attributes.{code}` |
| **`dataType`** | `text` / `decimal` / `integer` / `boolean` / `list` — validation rules. | Book |
| **`unit`** | For decimals (e.g. mm). | Book |
| **`texts[]`** | Labels per `languageId` (attribute labels, not product name). | Book |
| **`options[]`** | For `list`: legal option codes (e.g. HX17). | Book |

### 6.4 Group and folder keys

| Key | Why | Maps to |
|-----|-----|---------|
| **`groups[].code`** | Group id | Book `groups.{code}` |
| **`groups[].attributes`** | Ordered list of attribute codes in group | Book |
| **`folderGroups[].categoryKey`** | Must exist on `/tree` (else row **NOT_FOUND**, retryable) | Link folder → group list on book + folder object in catalog |
| **`folderGroups[].groups`** | Which groups apply on that folder’s **branch** | Book `folders.{categoryKey}` |

**Pimcore storage:** one object **`FoAttributeBook`** at **`/ErpSync/AttributeBook/current`**, field **`payload`** (JSON textarea). Attribute **values** are not in this object.

---

## 7. POST `/products`

### 7.1 Purpose

Create **masters** and **variants**: identity, parent link, optional default **name**, allowed dimension lists, variant pointers to `/dimensions` codes.

Does **not** write head type, length, material, shops, or washer link (open).

### 7.2 Shape — why mixed rows in `items[]`?

```json
{
  "items": [
    { "code": "35044", "layer": "master", "parentKey": "5637145021", "name": "...", "allowedColour": ["59"] },
    { "itemNumber": "35044-21-59-8-1", "masterItemNumber": "35044", "layer": "variant", "colour": "59", "size": "8" }
  ]
}
```

| Design | Why |
|--------|-----|
| **Same array, two row shapes** | F&O sends masters and variants in one export batch; **`masterItemNumber`** (or `layer: "variant"`) discriminates variant rows. |
| **Master before variant in batch** | Variant resolves master by code; otherwise **NOT_FOUND** (retryable). |
| **`allowedColour` / `allowedSize` / … arrays** | Master declares which codes variants may use; PIM can add variants later within that list. |

### 7.3 Keys

| Key | On | Match key? | Maps to Pimcore |
|-----|-----|------------|-----------------|
| **`code`** | master | Yes | Master `code` |
| **`parentKey`** | master | — | Level-5 folder `categoryKey` → parent object |
| **`layer`** | both | — | `"master"` or `"variant"` |
| **`name`** | both | — | Plain `name` input |
| **`allowedConfig` / `allowedColour` / `allowedSize` / `allowedStyle`** | master | — | Many-to-many to dim option objects |
| **`itemNumber`** | variant | Yes | Variant `itemNumber` |
| **`masterItemNumber`** | variant | — | Parent master `code` |
| **`config` / `colour` / `size` / `style`** | variant | — | Many-to-one to dim options by **code** |
| **`washerItemNumber`** | variant | — | **Ignored** until confirmed |
| **`isDeleted`** | both | — | Unpublish |

**Path:** master under `.../productGroup/{masterCode}/`; variant as child object (variant type in Pimcore).  
**Class:** from level-1 ancestor: `PtScrew` or `PtWasher`. Washers: only **`size`** + **`allowedSize`**; other axes → `ignored`.

---

## 8. POST `/product-attributes`

### 8.1 Purpose

Set **technical facts** on an item that already exists (master **code** or variant **itemNumber**).

### 8.2 Shape — why `items[]` + `attributes[]`?

```json
{
  "items": [{
    "itemNumber": "35044-21-59-8-1",
    "attributes": [
      { "attributeCode": "RH_Head", "value": "HX17" },
      { "attributeCode": "DIAMETER", "value": "6.5", "unit": "mm" }
    ]
  }]
}
```

| Level | Why |
|-------|-----|
| **`items[]`** | One product (SKU or master) per object — typical batch unit for F&O “attributes on this item”. |
| **`attributes[]`** | Many facts per item in one POST; each element is one code/value pair. |

**Why not flatten into `"RH_Head": "HX17"` on the item?**  
F&O’s export is row-oriented (attributeCode + value + unit + valueTo). Arrays keep order, optional fields, and **`isDeleted`** per attribute without a huge fixed schema.

### 8.3 Keys

| Key | Why | Behaviour |
|-----|-----|-----------|
| **`itemNumber`** | Match master or variant | Required |
| **`attributeCode`** | Must match definition `code` | |
| **`value`** | Scalar or option code | List values must match definition options |
| **`valueTo`** | Upper bound for drill cap | Maps to `kl_drillCapTo` with `DRILL CAP MM` |
| **`unit`** | For decimals | Quantity unit |
| **`isDeleted` / null value** | Clear **this attribute only** | Does not unpublish product |

### 8.4 Placement (`folderGroups` from step 4)

The **branch** is the folder named in setup. Known codes write on the **owning layer inside that branch** (not moved upward):

| Codes (examples) | Layer object | Pimcore field / store |
|------------------|--------------|------------------------|
| `RH_Head`, `RH_Point`, `DRIVE TYPE`, … | series | Relations / lookups |
| `MATERIAL TYPE`, `CORROSION CATEGORY`, `RH_Coating` | range | Relations |
| `DIAMETER`, `DRILL CAP MM`, `RH_Drive` | productGroup | Classification store keys |
| `LENGTH MM`, partial/effective length | **master** of this item | Classification store on master |

Unknown codes → **`foAttributeBag`** JSON on the **named folder**.  
Lookup values may create objects under **`/ErpSync/AttributeOptions/{Class}`**.

---

## 9. POST `/product-translations`

### 9.1 Purpose

Product **name** (and optional description text) per F&O **`languageId`**. Primary **`en-CA`** → single plain **`name`** field (client system language).

### 9.2 Shape — why `texts[]`?

```json
{
  "items": [{
    "itemNumber": "35044",
    "texts": [
      { "languageId": "en-CA", "name": "Hex screw", "description": "..." },
      { "languageId": "en-US", "name": "Hex screw US" }
    ]
  }]
}
```

| Design | Why |
|--------|-----|
| **`items[]` one product per object** | Same as attributes — batch of products. |
| **`texts[]` array** | F&O sends **N languages** per item; not a fixed set of columns. New locales do not require API version changes. |
| **Partial batch** | Only languages **in this POST** are updated; omitted languages are **not** deleted. |

### 9.3 Keys

| Key | Why | Maps to |
|-----|-----|---------|
| **`itemNumber`** | Master or variant | Same object as `/products` |
| **`texts[].languageId`** | F&O locale id stored as sent | Bag key; `en-CA` also drives `name` |
| **`texts[].name`** | Product title in that language | `en-CA` → **`name`**; others → **`foTranslationBag.texts.{id}.name`** |
| **`texts[].description`** | Long text | Bag only (no product description field yet) |
| **`isDeleted` on item** | — | **Ignored** (use `/products` to unpublish) |

**Not** shop `da`/`sv` marketing copy — that stays PIM on storefront bricks.

---

## 10. POST `/released` (not built)

**Shape (planned):** `items[]` of `{ itemNumber, companyCode, released: boolean }` — one row per **SKU × shop** because release is inherently a matrix. Returns **404** today.

---

## 11. Quick reference — API → root folder

| API | Primary Pimcore location |
|-----|---------------------------|
| `/companies` | `/ErpSync/LegalEntities/` |
| `/dimensions` | `/ErpSync/DimOptions/` |
| `/tree`, `/products` | `/ErpSync/Catalog/` |
| `/attribute-definitions` | `/ErpSync/AttributeBook/current` (+ folder links in Catalog) |
| `/product-attributes` | Fields on objects under `/ErpSync/Catalog/` |
| `/product-translations` | `name` + `foTranslationBag` on master/variant |
| `/ping` | `/ErpIntake/` |

---

## 12. Related docs

| Doc | Use when |
|-----|----------|
| [FO_MANUAL_TEST_RUNBOOK.md](FO_MANUAL_TEST_RUNBOOK.md) | You want to POST step-by-step and open objects in admin. |
| [FO_API.html](FO_API.html) | Official samples and field-required tables. |
| [how-pim-builds.html](how-pim-builds.html) | Visual order from empty Pimcore. |
