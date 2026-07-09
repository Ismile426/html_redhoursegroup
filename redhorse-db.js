/* ============================================================
 * RedHorse local product DB (demo)
 * Single source of truth shared by:
 *   - RedHorse_Product_Creation_Wizard.html
 *   - RedHorse_Product_Listing.html
 *
 * Hierarchy (Method B):
 *   Company → Catalog (product type) → Brand → Range (template)
 *     → Item (base variant, sellable, e.g. 404001)
 *       → Sub-variant (add-on child, e.g. 404001-1-26-3-2)
 * ============================================================ */
window.RH_DB = {

  companies: [
    { id:'dk', name:'RED HORSE Denmark',    flag:'🇩🇰' },
    { id:'se', name:'Aston Sweden',         flag:'🇸🇪' },
    { id:'us', name:'RED HORSE USA',        flag:'🇺🇸' },
    { id:'ec', name:'Star Fasteners+ (web)', flag:'🌐' }
  ],

  catalogs: [
    { id:'Screws', icon:'🔩' },
    { id:'Rivets', icon:'📌' },
    { id:'Hammer', icon:'🔨' },
    { id:'Washer', icon:'🔘' }
  ],

  brands: {
    Screws: [ { code:'CREO', name:'CREO®' }, { code:'AXIS', name:'AXIS®' }, { code:'ROCO', name:'ROCO®' }, { code:'URSUS', name:'URSUS®' } ],
    Rivets: [ { code:'RHRIV', name:'RedHorse Rivets' } ],
    Hammer: [ { code:'RHTOOLS', name:'RedHorse Tools' } ],
    Washer: [ { code:'RHFIX', name:'RedHorse Fixing' } ]
  },

  /* Add-on dimensions — the ONLY codes appended to an item number (Config-Colour-Size-Style) */
  dimDefs: [
    { key:'config', label:'Configuration',        rh:'material + washer build — PDF: MAT-SILVER WSH-ALU14B', opts:['Standard (0)','MAT-SILVER WSH-ALU14B (1)','WSH-EPDM (5)','Long thread (21)'] },
    { key:'colour', label:'Colour · Powder paint', rh:'PDF: Powder paint colour',                             opts:['No Colour (0)','RAL 9010 DS (8)','RAL 8371 M (26)','RAL 9005 Jet Black (59)'] },
    { key:'size',   label:'Size · Pack',           rh:'PDF: how it is sold, not screw length',                opts:['PCS (0)','150 (3)','Box of 100 (8)'] },
    { key:'style',  label:'Style · Label',         rh:'PDF: label style — RH C25B / RH4001 C25B',             opts:['NA (0)','RH C25B (1)','RH4001 C25B (2)'] }
  ],

  crossSellOptions: {
    Screws: ['EPDM washers','TX20 bit','TX25 bit','PZ2 bit','Bit socket','Decking spacer','Masonry drill Ø6','HX8 wrench bit'],
    Rivets: ['Rivet gun nozzle 3.2','Rivet gun nozzle 4.8'],
    Hammer: ['Spare fiberglass handle','Nail puller'],
    Washer: ['Facade screw 40400 range']
  },

  /* ----------------------------------------------------------
   * Templates (ranges). Each carries its variants (base items)
   * and every variant carries its add-on sub-variants.
   * Item number  = template code + seq   → 404001
   * Sub number   = item + -c-col-s-st    → 404001-1-26-3-2
   * ---------------------------------------------------------- */
  templates: [

    /* ================= SCREWS ================= */
    { code:'40400', catalog:'Screws', name:'Self-drilling facade DxL TX', brands:['CREO','AXIS'],
      fixed:{ 'Head Type':'Mushroom head (MH)','Thread Type':'Type B, medium','Screw Type':'Self-drilling','Point Type':'Drill point #2','Material':'Bi-metal, stainless A2','Target Material':'Steel, alu','Surface Treatment':'Cosmetic zink, ZnB10','Surface Treatment Color':'Silver','Self Drilling Y/N':'Y','Self Tapping Y/N':'Y','Powder Paint Y/N':'Y','Washer Y/N':'Y','Washer Type':'Bonded EPDM' },
      pools:{ 'Drive Type':['TX20'],'Major Diameters':['4.8 mm','5.5 mm'],'Lengths':['25 mm','38 mm'],'Drill Capacity':['2-6 mm steel','4-8 mm steel'],'Drill Point Diameter':['5 mm','6.5 mm'],'Drill Point Length':['6 mm','8 mm'],'Weights':['6 g','11 g'],'Head Diameter':['12 mm'],'Partial Lengths':[],'Effective Lengths':['26 mm','18 mm'] },
      features:{ 'Special Features':[],'Typical Applications':['Steel sheet to steel','Steel sheet to alu'] },
      crossSell:['EPDM washers','TX20 bit'],
      merch:{ dk:{released:true}, se:{released:true}, us:{released:false}, ec:{released:true} },
      dims:{ config:['Standard (0)','WSH-EPDM (5)','Long thread (21)'], colour:['No Colour (0)','RAL 9005 Jet Black (59)'], size:['PCS (0)','Box of 100 (8)'], style:['NA (0)','RH C25B (1)'] },
      variants:[
        { seq:1, brands:['CREO','AXIS'], tier:'Standard',
          picks:{ 'Drive Type':'TX20','Major Diameters':'4.8 mm','Lengths':'25 mm','Drill Capacity':'2-6 mm steel','Drill Point Diameter':'5 mm','Drill Point Length':'6 mm','Weights':'6 g','Head Diameter':'12 mm','Partial Lengths':'','Effective Lengths':'26 mm' },
          subs:[
            { brands:['CREO','AXIS'], config:'WSH-EPDM (5)', colour:'RAL 9005 Jet Black (59)', size:'', style:'' },
            { brands:['CREO'], config:'', colour:'', size:'Box of 100 (8)', style:'RH C25B (1)' }
          ] },
        { seq:2, brands:['CREO'], tier:'Premium',
          picks:{ 'Drive Type':'TX20','Major Diameters':'5.5 mm','Lengths':'38 mm','Drill Capacity':'4-8 mm steel','Drill Point Diameter':'6.5 mm','Drill Point Length':'8 mm','Weights':'11 g','Head Diameter':'12 mm','Partial Lengths':'','Effective Lengths':'18 mm' },
          subs:[
            { config:'WSH-EPDM (5)', colour:'RAL 9005 Jet Black (59)', size:'Box of 100 (8)', style:'RH C25B (1)' }
          ] }
      ] },

    { code:'30300', catalog:'Screws', name:'Wood screw DxL-L1 TX', brands:['CREO'],
      fixed:{ 'Head Type':'Countersunk w. turbine ribs (CSH-TR)','Thread Type':'Wood','Screw Type':'Wood screw','Point Type':'Sharp point (S-point)','Material':'Carbon steel','Target Material':'Wood','Surface Treatment':'Zytec™+','Surface Treatment Color':'Black','Self Drilling Y/N':'N','Self Tapping Y/N':'Y','Powder Paint Y/N':'N','Washer Y/N':'N','Washer Type':'—' },
      pools:{ 'Drive Type':['TX25','TX30'],'Major Diameters':['7.2 mm','8 mm'],'Lengths':['120 mm','180 mm','220 mm'],'Drill Capacity':[],'Drill Point Diameter':[],'Drill Point Length':[],'Weights':['31 g','45 g','62 g'],'Head Diameter':['13 mm','15 mm'],'Partial Lengths':['91 mm','120 mm','150 mm'],'Effective Lengths':['111 mm','156 mm','215 mm'] },
      features:{ 'Special Features':['Turbine Ribs','Thread cut','Knurls'],'Typical Applications':['Load bearing elements','CLT-connection'] },
      crossSell:['TX25 bit'],
      merch:{ dk:{released:true}, se:{released:true}, us:{released:false}, ec:{released:false} },
      dims:{ config:['Standard (0)'], colour:['No Colour (0)'], size:['PCS (0)','Box of 100 (8)'], style:['NA (0)'] },
      variants:[
        { seq:1, brands:['CREO'], tier:'Standard',
          picks:{ 'Drive Type':'TX25','Major Diameters':'7.2 mm','Lengths':'120 mm','Drill Capacity':'','Drill Point Diameter':'','Drill Point Length':'','Weights':'31 g','Head Diameter':'13 mm','Partial Lengths':'91 mm','Effective Lengths':'111 mm' },
          subs:[ { config:'', colour:'', size:'Box of 100 (8)', style:'' } ] },
        { seq:2, brands:['CREO'], tier:'Standard',
          picks:{ 'Drive Type':'TX30','Major Diameters':'8 mm','Lengths':'180 mm','Drill Capacity':'','Drill Point Diameter':'','Drill Point Length':'','Weights':'45 g','Head Diameter':'15 mm','Partial Lengths':'120 mm','Effective Lengths':'156 mm' },
          subs:[] },
        { seq:3, brands:['CREO'], tier:'Pro',
          picks:{ 'Drive Type':'TX30','Major Diameters':'8 mm','Lengths':'220 mm','Drill Capacity':'','Drill Point Diameter':'','Drill Point Length':'','Weights':'62 g','Head Diameter':'15 mm','Partial Lengths':'150 mm','Effective Lengths':'215 mm' },
          subs:[] }
      ] },

    /* the range from the PDF example: 30444-1-26-0-0 / -1-8-3-1 / -1-26-3-2 */
    { code:'30444', catalog:'Screws', name:'Facade screw w. alu washer (PDF example)', brands:['AXIS','ROCO'],
      fixed:{ 'Head Type':'Hex washer head (HWH)','Thread Type':'Type B, medium','Screw Type':'Self-drilling','Point Type':'Drill point #2','Material':'Bi-metal, stainless A2','Target Material':'Steel, alu','Surface Treatment':'ZnB20','Surface Treatment Color':'Silver','Self Drilling Y/N':'Y','Self Tapping Y/N':'Y','Powder Paint Y/N':'Y','Washer Y/N':'Y','Washer Type':'Bonded EPDM' },
      pools:{ 'Drive Type':['TX25','HX8'],'Major Diameters':['5.5 mm','6.0 mm'],'Lengths':['50 mm','80 mm','100 mm'],'Drill Capacity':['4-8 mm steel'],'Drill Point Diameter':['6.5 mm'],'Drill Point Length':['8 mm'],'Weights':['17 g','22 g','28 g'],'Head Diameter':['16 mm'],'Partial Lengths':[],'Effective Lengths':['37 mm','58 mm','78 mm'] },
      features:{ 'Special Features':['Milling ribs'],'Typical Applications':['Steel sheet to steel'] },
      crossSell:['HX8 wrench bit','EPDM washers'],
      merch:{ dk:{released:true}, se:{released:false}, us:{released:true}, ec:{released:true} },
      dims:{ config:['Standard (0)','MAT-SILVER WSH-ALU14B (1)'], colour:['No Colour (0)','RAL 9010 DS (8)','RAL 8371 M (26)'], size:['PCS (0)','150 (3)'], style:['NA (0)','RH C25B (1)','RH4001 C25B (2)'] },
      variants:[
        { seq:1, brands:['AXIS','ROCO'], tier:'Standard',
          picks:{ 'Drive Type':'TX25','Major Diameters':'5.5 mm','Lengths':'50 mm','Drill Capacity':'4-8 mm steel','Drill Point Diameter':'6.5 mm','Drill Point Length':'8 mm','Weights':'17 g','Head Diameter':'16 mm','Partial Lengths':'','Effective Lengths':'37 mm' },
          subs:[
            { config:'MAT-SILVER WSH-ALU14B (1)', colour:'RAL 8371 M (26)', size:'', style:'' },
            { config:'MAT-SILVER WSH-ALU14B (1)', colour:'RAL 9010 DS (8)', size:'150 (3)', style:'RH C25B (1)' },
            { config:'MAT-SILVER WSH-ALU14B (1)', colour:'RAL 8371 M (26)', size:'150 (3)', style:'RH4001 C25B (2)' }
          ] },
        { seq:2, brands:['AXIS'], tier:'Premium',
          picks:{ 'Drive Type':'HX8','Major Diameters':'6.0 mm','Lengths':'100 mm','Drill Capacity':'4-8 mm steel','Drill Point Diameter':'6.5 mm','Drill Point Length':'8 mm','Weights':'28 g','Head Diameter':'16 mm','Partial Lengths':'','Effective Lengths':'78 mm' },
          subs:[ { config:'MAT-SILVER WSH-ALU14B (1)', colour:'RAL 9010 DS (8)', size:'', style:'' } ] }
      ] },

    { code:'50120', catalog:'Screws', name:'Concrete screw CSH-C', brands:['URSUS'],
      fixed:{ 'Head Type':'CSH-C','Thread Type':'Special (concrete)','Screw Type':'Concrete screw','Point Type':'Assymetrical point','Material':'Carbon steel','Target Material':'Concrete','Surface Treatment':'Zytec™ XT','Surface Treatment Color':'Gray','Self Drilling Y/N':'N','Self Tapping Y/N':'Y','Powder Paint Y/N':'N','Washer Y/N':'N','Washer Type':'—' },
      pools:{ 'Drive Type':['TX30','TX40'],'Major Diameters':['7.5 mm'],'Lengths':['60 mm','80 mm','100 mm'],'Drill Capacity':[],'Drill Point Diameter':[],'Drill Point Length':[],'Weights':['22 g','28 g','34 g'],'Head Diameter':['13 mm'],'Partial Lengths':[],'Effective Lengths':['47 mm','48 mm','58 mm'] },
      features:{ 'Special Features':['Cutting ribs','Reversed thread'],'Typical Applications':['Fixing into concrete'] },
      crossSell:['Masonry drill Ø6'],
      merch:{ dk:{released:true}, se:{released:false}, us:{released:false}, ec:{released:true} },
      dims:{ config:['Standard (0)'], colour:['No Colour (0)'], size:['PCS (0)','Box of 100 (8)'], style:['NA (0)','RH C25B (1)'] },
      variants:[
        { seq:1, brands:['URSUS'], tier:'Basic',
          picks:{ 'Drive Type':'TX30','Major Diameters':'7.5 mm','Lengths':'60 mm','Drill Capacity':'','Drill Point Diameter':'','Drill Point Length':'','Weights':'22 g','Head Diameter':'13 mm','Partial Lengths':'','Effective Lengths':'47 mm' },
          subs:[ { config:'', colour:'', size:'Box of 100 (8)', style:'RH C25B (1)' } ] },
        { seq:2, brands:['URSUS'], tier:'Basic',
          picks:{ 'Drive Type':'TX40','Major Diameters':'7.5 mm','Lengths':'100 mm','Drill Capacity':'','Drill Point Diameter':'','Drill Point Length':'','Weights':'34 g','Head Diameter':'13 mm','Partial Lengths':'','Effective Lengths':'58 mm' },
          subs:[] }
      ] },

    /* ================= RIVETS ================= */
    { code:'60100', catalog:'Rivets', name:'Blind rivet alu DxL', brands:['RHRIV'],
      fixed:{ 'Material':'Aluminium AlMg 2.5','Mandrel':'Steel, zinc plated','Head Style':'Dome head','Target Material':'Steel, alu' },
      pools:{ 'Rivet Diameter':['3.2 mm','4.0 mm','4.8 mm'],'Grip Range':['1.5-3.0 mm','3.0-5.0 mm','5.0-6.5 mm'] },
      features:{ 'Typical Applications':['Sheet to sheet joining','HVAC ducting'] },
      crossSell:['Rivet gun nozzle 3.2','Rivet gun nozzle 4.8'],
      merch:{ dk:{released:true}, se:{released:true}, us:{released:true}, ec:{released:false} },
      dims:{ config:['Standard (0)'], colour:['No Colour (0)','RAL 9005 Jet Black (59)'], size:['PCS (0)','Box of 100 (8)'], style:['NA (0)'] },
      variants:[
        { seq:1, brands:['RHRIV'], tier:'Standard',
          picks:{ 'Rivet Diameter':'3.2 mm','Grip Range':'1.5-3.0 mm' },
          subs:[ { config:'', colour:'', size:'Box of 100 (8)', style:'' } ] },
        { seq:2, brands:['RHRIV'], tier:'Standard',
          picks:{ 'Rivet Diameter':'4.8 mm','Grip Range':'3.0-5.0 mm' },
          subs:[ { config:'', colour:'RAL 9005 Jet Black (59)', size:'Box of 100 (8)', style:'' } ] }
      ] },

    /* ================= HAMMER ================= */
    { code:'40021', catalog:'Hammer', name:'Claw hammer fiberglass', brands:['RHTOOLS'],
      fixed:{ 'Type':'Claw hammer','Head Material':'Forged carbon steel','Handle Material':'Fiberglass, TPR grip','Face':'Polished, bevelled' },
      pools:{ 'Head Weight':['450 g','570 g'],'Handle Length':['300 mm','330 mm'] },
      features:{ 'Typical Applications':['General carpentry','Framing'] },
      crossSell:['Spare fiberglass handle','Nail puller'],
      merch:{ dk:{released:true}, se:{released:true}, us:{released:true}, ec:{released:true} },
      dims:{ config:['Standard (0)'], colour:['No Colour (0)','RAL 9005 Jet Black (59)'], size:['PCS (0)'], style:['NA (0)','RH C25B (1)'] },
      variants:[
        { seq:1, brands:['RHTOOLS'], tier:'Standard',
          picks:{ 'Head Weight':'450 g','Handle Length':'300 mm' },
          subs:[ { config:'', colour:'', size:'', style:'RH C25B (1)' } ] },
        { seq:2, brands:['RHTOOLS'], tier:'Pro',
          picks:{ 'Head Weight':'570 g','Handle Length':'330 mm' },
          subs:[ { config:'', colour:'RAL 9005 Jet Black (59)', size:'', style:'RH C25B (1)' } ] }
      ] },

    /* ================= WASHER ================= */
    { code:'70200', catalog:'Washer', name:'Bonded EPDM sealing washer', brands:['RHFIX'],
      fixed:{ 'Material':'Steel + EPDM rubber','Coating':'Zinc plated','Type':'Bonded sealing washer' },
      pools:{ 'Outer Diameter':['14 mm','16 mm','19 mm'],'Bore':['5.5 mm','6.3 mm'] },
      features:{ 'Typical Applications':['Roofing screws','Facade screws'] },
      crossSell:['Facade screw 40400 range'],
      merch:{ dk:{released:true}, se:{released:true}, us:{released:false}, ec:{released:true} },
      dims:{ config:['Standard (0)'], colour:['No Colour (0)'], size:['PCS (0)','Box of 100 (8)'], style:['NA (0)'] },
      variants:[
        { seq:1, brands:['RHFIX'], tier:'Standard',
          picks:{ 'Outer Diameter':'14 mm','Bore':'5.5 mm' },
          subs:[ { config:'', colour:'', size:'Box of 100 (8)', style:'' } ] },
        { seq:2, brands:['RHFIX'], tier:'Standard',
          picks:{ 'Outer Diameter':'19 mm','Bore':'6.3 mm' },
          subs:[] }
      ] }
  ]
};

/* ---- Shared helpers (numbering identical to the wizard) ---- */
window.RH_HELPERS = {
  optCode(opt){ const m = String(opt||'').match(/\((\w[\w-]*)\)/); return m ? m[1] : '0'; },
  itemNumber(tpl, v){ return `${tpl.code}${v.seq}`; },
  subNumber(tpl, v, sub){
    const oc = window.RH_HELPERS.optCode;
    const c = sub.config ? oc(sub.config) : '0', col = sub.colour ? oc(sub.colour) : '0';
    const s = sub.size ? oc(sub.size) : '0', st = sub.style ? oc(sub.style) : '0';
    return `${tpl.code}${v.seq}-${c}-${col}-${s}-${st}`;
  }
};
