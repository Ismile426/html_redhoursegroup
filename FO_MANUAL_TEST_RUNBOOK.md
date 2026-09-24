# F&O → Pimcore manual test runbook

Use this to call **one API at a time**, see what appears in Pimcore, and understand how payloads map to classes and folders.

**Contract (full field tables):** [FO_API.html](FO_API.html) · **Plain flow:** [how-pim-connects.html](how-pim-connects.html) · **Developer diagram:** [how-pim-builds.html](how-pim-builds.html)

---

## 1. Before you POST anything

### 1.1 URLs and key

| Environment | Base URL |
|-------------|----------|
| Local Docker | `http://localhost/api/v1` |
| TEST (RH LAN) | `http://10.100.16.4:82/api/v1` |

Every call needs header **`X-API-Key`**. Value is in `redhorse-demo/.env.local` as `FO_API_KEY`. Do not commit or paste it into chat.

Wrapper shape for all writes:

```json
{ "batchId": "your-run-id", "items": [ ] }
```

Max **500** rows or **2 MB** per request.

### 1.2 Console scripts (what they create)

Run inside the PHP container from `redhorse-demo/`:

```bash
docker compose exec php bin/console cache:clear
```

| Command | What it does | Folders / files touched |
|---------|----------------|-------------------------|
| **`app:load-kalle-type-demo --classes-only`** | Builds **classes and measure store only**. No demo products. Safe on TEST. | **Classes** (definitions in `var/classes/`, PHP under `var/classes/DataObject/` after cache clear): `PtScrew`, `PtWasher`, lookups (`PtHeadType`, `PtMaterial`, `PtCorrosionCategory`, `PtColourOption`, …), `PtLegalEntity`, storefront objectbricks. **Classification store** keys (diameter, length, drill cap, …). Does **not** write `/ErpSync` or F&O data. |
| **`app:load-kalle-type-demo --force`** | Same as above **plus** deletes and recreates **`/TypeBasedCatalog`** workshop demo tree and assets. | **Never on TEST** unless you intend to wipe the workshop catalogue. |
| **`app:ensure-erp-sync`** | Creates empty F&O intake folders if missing. | `/ErpSync`, `/ErpSync/LegalEntities`, `/ErpSync/Catalog`, `/ErpSync/DimOptions`, `/ErpSync/AttributeBook`, `/ErpSync/AttributeOptions`, `/ErpIntake` |
| **`app:reset-erp-sync`** | Deletes F&O objects under **`/ErpSync` only** (companies, catalog tree, dimension options, attribute book). | Does **not** touch `/TypeBasedCatalog`. Use before a clean API retest. |
| **`app:verify-erp-sync`** | Reports empty fields owned by **live** feeds. Exit 0 = OK. | Read-only. |

**Two trees — do not confuse them:**

| Tree | Who writes | Purpose |
|------|------------|---------|
| **`/TypeBasedCatalog`** | Workshop command (`--force` seed) + PIM users | Screens demo; colour codes may already exist here |
| **`/ErpSync/...`** | F&O REST only | Red Horse feed data |

F&O APIs **never** write `/TypeBasedCatalog`.

---

## 2. API → Pimcore mapping (cheat sheet)

| POST | Match key | Pimcore class | Path under `/ErpSync` |
|------|-----------|---------------|------------------------|
| `/companies` | `companyCode` | `PtLegalEntity` | `/LegalEntities/{code}` |
| `/dimensions` | `dimension` + `values[].code` | `PtConfigOption`, `PtColourOption`, `PtSizeOption`, `PtStyleOption` | `/DimOptions/{Class}/{code}` |
| `/tree` | `categoryKey` | `PtScrew` or `PtWasher` (folder rows, `layer` type…productGroup) | `/Catalog/{categoryKey}/…` nested by parent |
| `/attribute-definitions` | attribute / group / folder rows | JSON book object | `/AttributeBook/current` (+ folder link rows under Catalog for `folderGroups`) |
| `/products` | master `code`, variant `itemNumber` | `PtScrew` / `PtWasher` (`layer` master / variant) | Master under level-5 folder; variant under master |
| `/product-attributes` | `itemNumber` | Same object as product | Fields on folder in branch (see §5) |
| `/product-translations` | `itemNumber` | Master or variant | `name` (+ `foTranslationBag` for other languages) |
| `/ping` | — | `FoIntakeLog` | `/ErpIntake/...` |
| `/released` | — | **Not built (404)** | — |

**Screw seven levels (folder + product):**

```
type (1) → family (2) → series (3) → range (4) → productGroup (5) → master → variant
         ↑ /tree                              ↑ /products              ↑ /product-attributes, /product-translations
```

---

## 3. Test IDs for this runbook

Replace these in JSON if you already used them. Keys are **F&O business ids**, not Pimcore numeric ids.

| Symbol | Example value | Role |
|--------|---------------|------|
| `T1` … `T5` | `RB-T1` … `RB-T5` | Tree `categoryKey`s levels 1–5 |
| `M` | `RB-M35044` | Master `code` |
| `V` | `RB-35044-59-8-1` | Variant `itemNumber` |
| `COL59` | `59` | Colour code (must match `/dimensions` and variant) |
| `SZ8` | `8` | Size code |

---

## 4. Step-by-step calls (curl)

Set once in your shell (use local or TEST base):

```bash
export BASE="http://localhost/api/v1"   # or http://10.100.16.4:82/api/v1
export KEY="<from .env.local FO_API_KEY>"
```

Helper:

```bash
post() { curl -sS -X POST "$BASE$1" -H "X-API-Key: $KEY" -H "Content-Type: application/json" -d "$2" | python3 -m json.tool; }
```

After each step, open **Pimcore Admin → Data Objects** and check the path in the **“Check in admin”** line.

---

### Step 0 — Auth (optional)

```bash
curl -sS -H "X-API-Key: $KEY" "$BASE/auth"
```

**Expect:** `"ok": true`. No objects created.

---

### Step 1 — `/companies`

```json
{
  "batchId": "runbook-1",
  "items": [
    { "companyCode": "RH", "name": "Red Horse A/S", "isDeleted": false }
  ]
}
```

```bash
post /companies '{"batchId":"runbook-1","items":[{"companyCode":"RH","name":"Red Horse A/S","isDeleted":false}]}'
```

**Check in admin:** `/ErpSync/LegalEntities/RH` → object class **PtLegalEntity**.  
**Note:** This does **not** turn on shop bricks on products.

---

### Step 2 — `/dimensions`

```json
{
  "batchId": "runbook-2",
  "items": [
    {
      "dimension": "colour",
      "values": [{ "code": "59", "name": "RAL 1003" }]
    },
    {
      "dimension": "size",
      "values": [{ "code": "8", "name": "100" }]
    }
  ]
}
```

**Check in admin:** `/ErpSync/DimOptions/PtColourOption/59`, `/ErpSync/DimOptions/PtSizeOption/8`.

---

### Step 3 — `/tree` (all five levels)

Send **parents before children** in one batch.

```json
{
  "batchId": "runbook-3",
  "items": [
    { "categoryKey": "RB-T1", "parentKey": null, "level": 1, "productType": "06", "name": "Screws" },
    { "categoryKey": "RB-T2", "parentKey": "RB-T1", "level": 2, "name": "CREO", "brand": "CREO" },
    { "categoryKey": "RB-T3", "parentKey": "RB-T2", "level": 3, "name": "Series demo" },
    { "categoryKey": "RB-T4", "parentKey": "RB-T3", "level": 4, "name": "Range demo" },
    { "categoryKey": "RB-T5", "parentKey": "RB-T4", "level": 5, "name": "PG demo", "productGroupNumber": "6666" }
  ]
}
```

**Check in admin:** `/ErpSync/Catalog/RB-T1/.../RB-T5` — each row is **PtScrew**, `layer` matches level.  
**Ignored today:** `texts[]` on folders (accepted, not stored).

---

### Step 4 — `/attribute-definitions` (setup)

One **`items[]` entry** with three arrays (not separate API rows per layer):

```json
{
  "batchId": "runbook-4",
  "items": [{
    "attributes": [
      {
        "code": "RH_Head",
        "dataType": "list",
        "options": [{ "code": "HX17", "texts": [] }]
      },
      {
        "code": "DIAMETER",
        "dataType": "decimal",
        "unit": "mm"
      },
      {
        "code": "LENGTH MM",
        "dataType": "decimal",
        "unit": "mm"
      }
    ],
    "groups": [
      { "code": "SHAPE", "attributes": ["RH_Head"] },
      { "code": "DRAW", "attributes": ["DIAMETER"] },
      { "code": "LEN", "attributes": ["LENGTH MM"] }
    ],
    "folderGroups": [
      { "categoryKey": "RB-T3", "groups": ["SHAPE"] },
      { "categoryKey": "RB-T5", "groups": ["DRAW"] }
    ]
  }]
}
```

**Check in admin:**

- `/ErpSync/AttributeBook/current` — book payload updated.
- Folder **RB-T3** / **RB-T5** linked to groups (same objects as tree).

If you send a `categoryKey` **before** step 3, folder rows fail **`NOT_FOUND`** (retryable); attribute definitions in the same batch are still stored.

---

### Step 5 — `/products` (master then variant)

```json
{
  "batchId": "runbook-5",
  "items": [
    {
      "code": "RB-M35044",
      "layer": "master",
      "parentKey": "RB-T5",
      "name": "Runbook master",
      "allowedColour": ["59"],
      "allowedSize": ["8"]
    },
    {
      "itemNumber": "RB-35044-59-8-1",
      "masterItemNumber": "RB-M35044",
      "layer": "variant",
      "name": "Runbook SKU",
      "colour": "59",
      "size": "8"
    }
  ]
}
```

**Check in admin:**

- Master: `/ErpSync/Catalog/.../RB-T5/RB-M35044` — `layer` = **master**.
- Variant: `.../RB-M35044/RB-35044-59-8-1` — `layer` = **variant**, colour/size relations set.

**Wrong order test:** variant before master in one batch → variant **`NOT_FOUND`**, master may still **`created`**; resend variant only.

---

### Step 6 — `/product-attributes`

```json
{
  "batchId": "runbook-6",
  "items": [{
    "itemNumber": "RB-35044-59-8-1",
    "attributes": [
      { "attributeCode": "RH_Head", "value": "HX17" },
      { "attributeCode": "DIAMETER", "value": "6.5", "unit": "mm" },
      { "attributeCode": "LENGTH MM", "value": "23", "unit": "mm" }
    ]
  }]
}
```

**Check in admin (same tree branch):**

| Code | Field / store | Object (layer) |
|------|----------------|----------------|
| `RH_Head` | `headType` → `PtHeadType` | **Series** folder RB-T3 |
| `DIAMETER` | `kl_dMajorMm` (CS) | **Product group** RB-T5 |
| `LENGTH MM` | `kl_lengthMm` (CS) | **Master** RB-M35044 |

Variant does **not** get its own head type; it inherits series.

Unknown codes → `foAttributeBag` on the folder named in setup.  
Diameter with **`/`** in value → `ignored`, not failed.

---

### Step 7 — `/product-translations`

Primary language **`en-CA`** → plain **`name`**.

```json
{
  "batchId": "runbook-7",
  "items": [{
    "itemNumber": "RB-M35044",
    "texts": [
      { "languageId": "en-CA", "name": "Hex screw CA name", "description": "CA description stored in bag" },
      { "languageId": "en-US", "name": "Hex screw US name" }
    ]
  }]
}
```

**Check in admin:** Master **RB-M35044** → **Name** = CA string; **F&O translations** textarea = JSON with `en-US` (and en-CA description if sent).

---

## 5. Attribute code → Pimcore field (known codes)

When `folderGroups` puts the product under that branch, writers fill:

| F&O code | Layer | Pimcore |
|----------|-------|---------|
| `RH_Head` / `HEAD TYPE` | series | `headType` |
| `RH_Point` / `POINT TYPE` | series | `pointType` |
| `RH_Thread` / `THREAD TYPE` | series | `threadType` |
| `RH_SpecialFeatures` | series | `features` |
| `DRIVE TYPE` | series | `driveType` |
| `MATERIAL TYPE` / `MATERIAL` | range | `material` |
| `RH_Coating` / `COATING` | range | `coating` |
| `CORROSION CATEGORY` | range | `corrosionCategory` |
| `DIAMETER` | productGroup | `kl_dMajorMm` |
| `DRILL CAP MM` | productGroup | `kl_drillCap` + `kl_drillCapTo` from `valueTo` |
| `RH_Drive` | productGroup | `kl_driveSize` (select) |
| `LENGTH MM` | master | `kl_lengthMm` |
| `PARTIAL LENGTH` | master | `kl_l1Mm` |
| `EFFECTIVE LENGTH` | master | `kl_lef` |

Send **`RH_Head`**, not `HEAD TYPE`, in new payloads.

---

## 6. Reverse checks (should fail correctly)

Run these **before** the forward steps (or on fake ids) to confirm guards:

| Call | Payload idea | Expected |
|------|----------------|----------|
| `/product-attributes` | Unknown `itemNumber` | `NOT_FOUND`, retryable |
| `/product-translations` | Unknown `itemNumber` | `NOT_FOUND`, retryable |
| `/products` | Bad `parentKey` | `NOT_FOUND` or `VALIDATION` |
| `/product-attributes` | Before step 5 | Same as unknown item |

---

## 7. Automated script (same order)

From repo root, after `export KEY=...`:

```bash
bash docs/scripts/fo-runbook-step-by-step.sh http://localhost/api/v1
```

The script prints `ok` / `failed` per step and uses prefix `RB-` keys above.

---

## 8. Clean up F&O test data

```bash
docker compose exec php bin/console app:reset-erp-sync
docker compose exec php bin/console app:verify-erp-sync
```

Workshop **`/TypeBasedCatalog`** stays.

---

## 9. Feed order (one line)

```
companies → dimensions → tree → attribute-definitions → products → product-attributes → product-translations
```

`/released` is **not built** (404).
