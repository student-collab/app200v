
const DATA = [
  { fylke: "Agder", id: "AG", kommune: [{id:"AG-0101",n:"Arendal"},{id:"AG-0102",n:"Birkenes"},{id:"AG-0103",n:"Bygland"},{id:"AG-0104",n:"Bykle"},{id:"AG-0105",n:"Evje og Hornnes"},{id:"AG-0106",n:"Farsund"},{id:"AG-0107",n:"Flekkefjord"},{id:"AG-0108",n:"Froland"},{id:"AG-0109",n:"Gjerstad"},{id:"AG-0110",n:"Grimstad"},{id:"AG-0111",n:"Hægebostad"},{id:"AG-0112",n:"Iveland"},{id:"AG-0113",n:"Kristiansand"},{id:"AG-0114",n:"Kvinesdal"},{id:"AG-0115",n:"Lillesand"},{id:"AG-0116",n:"Lindesnes"},{id:"AG-0117",n:"Lyngdal"},{id:"AG-0118",n:"Risør"},{id:"AG-0119",n:"Sirdal"},{id:"AG-0120",n:"Tvedestrand"},{id:"AG-0121",n:"Valle"},{id:"AG-0122",n:"Vegårshei"},{id:"AG-0123",n:"Vennesla"},{id:"AG-0124",n:"Åmli"},{id:"AG-0125",n:"Åseral"}] },
  { fylke: "Akershus", id: "AK", kommune: [{id:"AK-0201",n:"Asker"},{id:"AK-0202",n:"Aurskog-Høland"},{id:"AK-0203",n:"Bærum"},{id:"AK-0204",n:"Enebakk"},{id:"AK-0205",n:"Frogn"},{id:"AK-0206",n:"Gjerdrum"},{id:"AK-0207",n:"Hurdal"},{id:"AK-0208",n:"Lillestrøm"},{id:"AK-0209",n:"Lørenskog"},{id:"AK-0210",n:"Nannestad"},{id:"AK-0211",n:"Nes"},{id:"AK-0212",n:"Nesodden"},{id:"AK-0213",n:"Nittedal"},{id:"AK-0214",n:"Nordre Follo"},{id:"AK-0215",n:"Rælingen"},{id:"AK-0216",n:"Råholt"},{id:"AK-0217",n:"Ullensaker"},{id:"AK-0218",n:"Vestby"},{id:"AK-0219",n:"Ås"}] },
  { fylke: "Buskerud", id: "BU", kommune: [{id:"BU-0301",n:"Drammen"},{id:"BU-0302",n:"Flesberg"},{id:"BU-0303",n:"Flå"},{id:"BU-0304",n:"Gol"},{id:"BU-0305",n:"Hemsedal"},{id:"BU-0306",n:"Hol"},{id:"BU-0307",n:"Hole"},{id:"BU-0308",n:"Hurum"},{id:"BU-0309",n:"Kongsberg"},{id:"BU-0310",n:"Krødsherad"},{id:"BU-0311",n:"Lier"},{id:"BU-0312",n:"Modum"},{id:"BU-0313",n:"Nesbyen"},{id:"BU-0314",n:"Nore og Uvdal"},{id:"BU-0315",n:"Numedal"},{id:"BU-0316",n:"Ringerike"},{id:"BU-0317",n:"Rollag"},{id:"BU-0318",n:"Sigdal"},{id:"BU-0319",n:"Øvre Eiker"}] },
  { fylke: "Finnmark", id: "FI", kommune: [{id:"FI-0401",n:"Alta"},{id:"FI-0402",n:"Berlevåg"},{id:"FI-0403",n:"Båtsfjord"},{id:"FI-0404",n:"Gamvik"},{id:"FI-0405",n:"Hammerfest"},{id:"FI-0406",n:"Hasvik"},{id:"FI-0407",n:"Karasjok"},{id:"FI-0408",n:"Kautokeino"},{id:"FI-0409",n:"Kvalsund"},{id:"FI-0410",n:"Lebesby"},{id:"FI-0411",n:"Loppa"},{id:"FI-0412",n:"Måsøy"},{id:"FI-0413",n:"Nesseby"},{id:"FI-0414",n:"Nordkapp"},{id:"FI-0415",n:"Porsanger"},{id:"FI-0416",n:"Sør-Varanger"},{id:"FI-0417",n:"Tana"},{id:"FI-0418",n:"Vadsø"},{id:"FI-0419",n:"Vardø"}] },
  { fylke: "Innlandet", id: "IN", kommune: [{id:"IN-0501",n:"Alvdal"},{id:"IN-0502",n:"Dovre"},{id:"IN-0503",n:"Engerdal"},{id:"IN-0504",n:"Etnedal"},{id:"IN-0505",n:"Folldal"},{id:"IN-0506",n:"Gausdal"},{id:"IN-0507",n:"Gjøvik"},{id:"IN-0508",n:"Gran"},{id:"IN-0509",n:"Hamar"},{id:"IN-0510",n:"Lesja"},{id:"IN-0511",n:"Lillehammer"},{id:"IN-0512",n:"Lom"},{id:"IN-0513",n:"Lunner"},{id:"IN-0514",n:"Nord-Fron"},{id:"IN-0515",n:"Nord-Odal"},{id:"IN-0516",n:"Nordre Land"},{id:"IN-0517",n:"Os"},{id:"IN-0518",n:"Ottadalen"},{id:"IN-0519",n:"Ringebu"},{id:"IN-0520",n:"Ringsaker"},{id:"IN-0521",n:"Sel"},{id:"IN-0522",n:"Skjåk"},{id:"IN-0523",n:"Stor-Elvdal"},{id:"IN-0524",n:"Søndre Land"},{id:"IN-0525",n:"Sør-Fron"},{id:"IN-0526",n:"Sør-Odal"},{id:"IN-0527",n:"Tolga"},{id:"IN-0528",n:"Trysil"},{id:"IN-0529",n:"Tynset"},{id:"IN-0530",n:"Vågå"},{id:"IN-0531",n:"Vestre Slidre"},{id:"IN-0532",n:"Vestre Toten"},{id:"IN-0533",n:"Jevnaker"},{id:"IN-0534",n:"Åmot"},{id:"IN-0535",n:"Åsnes"},{id:"IN-0536",n:"Øyer"},{id:"IN-0537",n:"Øystre Slidre"}] },
  { fylke: "Møre og Romsdal", id: "MR", kommune: [{id:"MR-0601",n:"Aukra"},{id:"MR-0602",n:"Averøy"},{id:"MR-0603",n:"Fjord"},{id:"MR-0604",n:"Giske"},{id:"MR-0605",n:"Gjemnes"},{id:"MR-0606",n:"Haram"},{id:"MR-0607",n:"Hareid"},{id:"MR-0608",n:"Hustadvika"},{id:"MR-0609",n:"Kristiansund"},{id:"MR-0610",n:"Molde"},{id:"MR-0611",n:"Rauma"},{id:"MR-0612",n:"Smøla"},{id:"MR-0613",n:"Stranda"},{id:"MR-0614",n:"Sula"},{id:"MR-0615",n:"Sunndal"},{id:"MR-0616",n:"Surnadal"},{id:"MR-0617",n:"Sykkylven"},{id:"MR-0618",n:"Tingvoll"},{id:"MR-0619",n:"Ulstein"},{id:"MR-0620",n:"Vanylven"},{id:"MR-0621",n:"Vestnes"},{id:"MR-0622",n:"Volda"},{id:"MR-0623",n:"Ørsta"},{id:"MR-0624",n:"Ålesund"}] },
  { fylke: "Nordland", id: "NO", kommune: [{id:"NO-0701",n:"Alstahaug"},{id:"NO-0702",n:"Andøy"},{id:"NO-0703",n:"Ballangen"},{id:"NO-0704",n:"Bindal"},{id:"NO-0705",n:"Bodø"},{id:"NO-0706",n:"Brønnøy"},{id:"NO-0707",n:"Bø"},{id:"NO-0708",n:"Dønna"},{id:"NO-0709",n:"Evenes"},{id:"NO-0710",n:"Fauske"},{id:"NO-0711",n:"Flakstad"},{id:"NO-0712",n:"Gildeskål"},{id:"NO-0713",n:"Gjerdingen"},{id:"NO-0714",n:"Hamarøy"},{id:"NO-0715",n:"Hemnes"},{id:"NO-0716",n:"Herøy"},{id:"NO-0717",n:"Leirfjord"},{id:"NO-0718",n:"Lurøy"},{id:"NO-0719",n:"Lødingen"},{id:"NO-0720",n:"Meløy"},{id:"NO-0721",n:"Moskenes"},{id:"NO-0722",n:"Narvik"},{id:"NO-0723",n:"Nesna"},{id:"NO-0724",n:"Rana"},{id:"NO-0725",n:"Rødøy"},{id:"NO-0726",n:"Røst"},{id:"NO-0727",n:"Saltdal"},{id:"NO-0728",n:"Sortland"},{id:"NO-0729",n:"Steigen"},{id:"NO-0730",n:"Sømna"},{id:"NO-0731",n:"Sørfold"},{id:"NO-0732",n:"Træna"},{id:"NO-0733",n:"Vefsn"},{id:"NO-0734",n:"Vega"},{id:"NO-0735",n:"Vestvågøy"},{id:"NO-0736",n:"Vevelstad"},{id:"NO-0737",n:"Værøy"},{id:"NO-0738",n:"Øksnes"}] },
  { fylke: "Oslo", id: "OS", kommune: [{id:"OS-0801",n:"Alna"},{id:"OS-0802",n:"Bjerke"},{id:"OS-0803",n:"Frogner"},{id:"OS-0804",n:"Gamle Oslo"},{id:"OS-0805",n:"Grorud"},{id:"OS-0806",n:"Grünerløkka"},{id:"OS-0807",n:"Nordre Aker"},{id:"OS-0808",n:"Nordstrand"},{id:"OS-0809",n:"Sagene"},{id:"OS-0810",n:"St. Hanshaugen"},{id:"OS-0811",n:"Stovner"},{id:"OS-0812",n:"Søndre Nordstrand"},{id:"OS-0813",n:"Ullern"},{id:"OS-0814",n:"Vestre Aker"},{id:"OS-0815",n:"Østensjø"}] },
  { fylke: "Rogaland", id: "RO", kommune: [{id:"RO-0901",n:"Bjerkreim"},{id:"RO-0902",n:"Bokn"},{id:"RO-0903",n:"Eigersund"},{id:"RO-0904",n:"Gjesdal"},{id:"RO-0905",n:"Haugesund"},{id:"RO-0906",n:"Hjelmeland"},{id:"RO-0907",n:"Hå"},{id:"RO-0908",n:"Karmøy"},{id:"RO-0909",n:"Klepp"},{id:"RO-0910",n:"Kvitsøy"},{id:"RO-0911",n:"Lund"},{id:"RO-0912",n:"Randaberg"},{id:"RO-0913",n:"Sandnes"},{id:"RO-0914",n:"Sauda"},{id:"RO-0915",n:"Sokndal"},{id:"RO-0916",n:"Sola"},{id:"RO-0917",n:"Stavanger"},{id:"RO-0918",n:"Strand"},{id:"RO-0919",n:"Suldal"},{id:"RO-0920",n:"Time"},{id:"RO-0921",n:"Tysvær"},{id:"RO-0922",n:"Utsira"},{id:"RO-0923",n:"Vindafjord"}] },
  { fylke: "Telemark", id: "TE", kommune: [{id:"TE-1001",n:"Bamble"},{id:"TE-1002",n:"Bo"},{id:"TE-1003",n:"Drangedal"},{id:"TE-1004",n:"Fyresdal"},{id:"TE-1005",n:"Hjartdal"},{id:"TE-1006",n:"Kragerø"},{id:"TE-1007",n:"Kviteseid"},{id:"TE-1008",n:"Midt-Telemark"},{id:"TE-1009",n:"Nissedal"},{id:"TE-1010",n:"Nome"},{id:"TE-1011",n:"Notodden"},{id:"TE-1012",n:"Porsgrunn"},{id:"TE-1013",n:"Rauland"},{id:"TE-1014",n:"Sauherad"},{id:"TE-1015",n:"Seljord"},{id:"TE-1016",n:"Siljan"},{id:"TE-1017",n:"Skien"},{id:"TE-1018",n:"Tokke"},{id:"TE-1019",n:"Vinje"},{id:"TE-1020",n:"Øvre Telemark"}] },
  { fylke: "Troms", id: "TR", kommune: [{id:"TR-1101",n:"Balsfjord"},{id:"TR-1102",n:"Berg"},{id:"TR-1103",n:"Dyrøy"},{id:"TR-1104",n:"Gratangen"},{id:"TR-1105",n:"Harstad"},{id:"TR-1106",n:"Ibestad"},{id:"TR-1107",n:"Karlsøy"},{id:"TR-1108",n:"Kvæfjord"},{id:"TR-1109",n:"Kvænangen"},{id:"TR-1110",n:"Lavangen"},{id:"TR-1111",n:"Lenvik"},{id:"TR-1112",n:"Lyngen"},{id:"TR-1113",n:"Målselv"},{id:"TR-1114",n:"Nordreisa"},{id:"TR-1115",n:"Salangen"},{id:"TR-1116",n:"Skjervøy"},{id:"TR-1117",n:"Sørreisa"},{id:"TR-1118",n:"Torsken"},{id:"TR-1119",n:"Tromsø"},{id:"TR-1120",n:"Tranøy"}] },
  { fylke: "Trøndelag", id: "TL", kommune: [{id:"TL-1201",n:"Flatanger"},{id:"TL-1202",n:"Frosta"},{id:"TL-1203",n:"Frøya"},{id:"TL-1204",n:"Grong"},{id:"TL-1205",n:"Hemne"},{id:"TL-1206",n:"Hitra"},{id:"TL-1207",n:"Holtålen"},{id:"TL-1208",n:"Høylandet"},{id:"TL-1209",n:"Indre Fosen"},{id:"TL-1210",n:"Inderøy"},{id:"TL-1211",n:"Klæbu"},{id:"TL-1212",n:"Leksvik"},{id:"TL-1213",n:"Levanger"},{id:"TL-1214",n:"Lierne"},{id:"TL-1215",n:"Malvik"},{id:"TL-1216",n:"Meråker"},{id:"TL-1217",n:"Midtre Gauldal"},{id:"TL-1218",n:"Namsos"},{id:"TL-1219",n:"Namsskogan"},{id:"TL-1220",n:"Nærøysund"},{id:"TL-1221",n:"Oppdal"},{id:"TL-1222",n:"Orkland"},{id:"TL-1223",n:"Osen"},{id:"TL-1224",n:"Overhalla"},{id:"TL-1225",n:"Rennebu"},{id:"TL-1226",n:"Røros"},{id:"TL-1227",n:"Røyrvik"},{id:"TL-1228",n:"Selbu"},{id:"TL-1229",n:"Skaun"},{id:"TL-1230",n:"Snåsa"},{id:"TL-1231",n:"Steinkjer"},{id:"TL-1232",n:"Stjørdal"},{id:"TL-1233",n:"Støren"},{id:"TL-1234",n:"Trondheim"},{id:"TL-1235",n:"Verdal"},{id:"TL-1236",n:"Verran"}] },
  { fylke: "Vestfold", id: "VF", kommune: [{id:"VF-1301",n:"Færder"},{id:"VF-1302",n:"Holmestrand"},{id:"VF-1303",n:"Horten"},{id:"VF-1304",n:"Larvik"},{id:"VF-1305",n:"Nevlunghavn"},{id:"VF-1306",n:"Nøtterøy"},{id:"VF-1307",n:"Re"},{id:"VF-1308",n:"Sandefjord"},{id:"VF-1309",n:"Stokke"},{id:"VF-1310",n:"Sande"},{id:"VF-1311",n:"Tønsberg"}] },
  { fylke: "Vestland", id: "VL", kommune: [{id:"VL-1401",n:"Alver"},{id:"VL-1402",n:"Askøy"},{id:"VL-1403",n:"Aurland"},{id:"VL-1404",n:"Austrheim"},{id:"VL-1405",n:"Bergen"},{id:"VL-1406",n:"Bjørnafjorden"},{id:"VL-1407",n:"Bremanger"},{id:"VL-1408",n:"Eidfjord"},{id:"VL-1409",n:"Etne"},{id:"VL-1410",n:"Fedje"},{id:"VL-1411",n:"Fitjar"},{id:"VL-1412",n:"Fjaler"},{id:"VL-1413",n:"Fusa"},{id:"VL-1414",n:"Gloppen"},{id:"VL-1415",n:"Gulen"},{id:"VL-1416",n:"Høyanger"},{id:"VL-1417",n:"Jondal"},{id:"VL-1418",n:"Kinn"},{id:"VL-1419",n:"Kvam"},{id:"VL-1420",n:"Kvinnherad"},{id:"VL-1421",n:"Lærdal"},{id:"VL-1422",n:"Luster"},{id:"VL-1423",n:"Masfjorden"},{id:"VL-1424",n:"Modalen"},{id:"VL-1425",n:"Osterøy"},{id:"VL-1426",n:"Samnanger"},{id:"VL-1427",n:"Sogndal"},{id:"VL-1428",n:"Solund"},{id:"VL-1429",n:"Stad"},{id:"VL-1430",n:"Stord"},{id:"VL-1431",n:"Stryn"},{id:"VL-1432",n:"Sunnfjord"},{id:"VL-1433",n:"Sunnhordland"},{id:"VL-1434",n:"Tysnes"},{id:"VL-1435",n:"Ullensvang"},{id:"VL-1436",n:"Ulvik"},{id:"VL-1437",n:"Vaksdal"},{id:"VL-1438",n:"Vik"},{id:"VL-1439",n:"Voss"},{id:"VL-1440",n:"Øygarden"}] },
  { fylke: "Østfold", id: "OF", kommune: [{id:"OF-1501",n:"Aremark"},{id:"OF-1502",n:"Fredrikstad"},{id:"OF-1503",n:"Halden"},{id:"OF-1504",n:"Hvaler"},{id:"OF-1505",n:"Indre Østfold"},{id:"OF-1506",n:"Marker"},{id:"OF-1507",n:"Moss"},{id:"OF-1508",n:"Rakkestad"},{id:"OF-1509",n:"Råde"},{id:"OF-1510",n:"Sarpsborg"},{id:"OF-1511",n:"Skiptvet"},{id:"OF-1512",n:"Våler"}] }
];

const selected = new Set();
const container = document.getElementById('fylkeListe');

let valgteKommuner =[];

function updateOutput() {
  valgteKommuner = Array.from(selected).sort();
  const lasteKnapp = document.getElementById('last-oppgaver');
  if(lasteKnapp) lasteKnapp.click();
  /*
  const displayList = document.getElementById("kommune-liste");
  displayList.innerHTML="";
  valgteKommuner.forEach((kommune) => {
                                let kommuneLI = document.createElement("li");
                                kommuneLI.textContent = kommune;
                                displayList.appendChild(kommuneLI);
                            });   
  */
  
  
}

export function getValgteKommuner() {
  return valgteKommuner;
}

function getCountyState(fylke) {
  const total = fylke.kommune.length;
  /* checked = antall kommuner i fylket fylke som har id i selected  */
  const checked = fylke.kommune.filter(m => selected.has(m.n)).length;
  if (checked === 0) return 'none';
  if (checked === total) return 'all';
  return 'some';
}
/*
    syncAll() does two things after any selection change:
        Re-reads selected to update every fylke checkbox state (checked / indeterminate / unchecked)
        Re-reads selected to update every municipality checkbox
               
                                                                                            */
function syncAll() {
  DATA.forEach(fylke => {
    const cb = document.getElementById('cb-fylke-' + fylke.id);
    if (!cb) return;
    const state = getCountyState(fylke);
    cb.checked = state === 'all';
    cb.indeterminate = state === 'some';
    fylke.kommune.forEach(m => {
      const mcb = document.getElementById('cb-' + m.id);
      if (mcb) mcb.checked = selected.has(m.n);
    });
  });
  updateOutput();
}

DATA.forEach(fylke => {
        /*
    {   fylke: "Vestfold", 
        id: "VF",
        kommune:  [
                    {id:"VF-1201",n:"Færder"},  
                    {id:"VF-1202",n:"Holmestrand"},
                    {id:"VF-1203",n:"Horten"},
                    {id:"VF-1204",n:"Larvik"},
                    {id:"VF-1205",n:"Nevlunghavn"},
                    {id:"VF-1206",n:"Nøtterøy"},
                    {id:"VF-1207",n:"Re"},
                    {id:"VF-1208",n:"Sandefjord"},
                    {id:"VF-1209",n:"Stokke"},
                    {id:"VF-1210",n:"Sande"}
                    {id:"VF-1211",n:"Tønsberg"}
                ] 
    

    }
        */
    const div = document.createElement('div');
    div.className = 'fylke';
    div.id = 'fylke-' + fylke.id;                   /* id =  'fylke-VF' */

    const header = document.createElement('div');
    header.className = 'fylke-header';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'fylke-cb';
    cb.id = 'cb-fylke-' + fylke.id;     /* 'cb-fylke-VF' */
    cb.onclick = e => {
      e.stopPropagation();
      /* Alle kommuner tilhører fylke med checked checkbox får sin id lagt til i var selected*/
      if (cb.checked){
        fylke.kommune.forEach(m => selected.add(m.n)); 
      }
      else{ 
        fylke.kommune.forEach(m => selected.delete(m.n)); /* Tom checkbox fjerner kommunenes navn fra selected */
      }
        syncAll();
  }
  const name = document.createElement('span');
  name.className = 'fylke-name';
  name.textContent = fylke.fylke;

  

  
    /*  9 linjer ager en fin > */
    const chev = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    chev.setAttribute('viewBox', '0 0 14 14');
    chev.setAttribute('fill', 'none');
    chev.setAttribute('stroke', 'currentColor');
    chev.setAttribute('stroke-width', '1.5');
    chev.classList.add('chevron');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M 4,2 l 5,5 -5,5');
    chev.appendChild(path);
            /* Fem linjer lager en liten > 
            const chev = document.createElement('span');
            chev.classList.add('chevron');
            chev.style.textAlign = 'center';
            chev.textContent = '›';
            chev.style.display = 'inline-block';
            */
  header.appendChild(cb);
  header.appendChild(name);
  header.appendChild(chev);

  const kommuneDiv = document.createElement('div');
  kommuneDiv.className = 'kommune';
  kommuneDiv.id = 'kommune-' + fylke.id;

  fylke.kommune.forEach(m => {
    const row = document.createElement('div');
    row.className = 'kommmune';
    row.dataset.name = m.n.toLowerCase();

    const mcb = document.createElement('input');
    mcb.type = 'checkbox';
    mcb.className = 'kommmune-cb';
    mcb.id = 'cb-' + m.id;
    mcb.onclick = () => {
      if (mcb.checked) selected.add(m.n);
      else selected.delete(m.n);
      syncAll();
    };

    const lbl = document.createElement('label');
    lbl.className = 'kommune-label';
    lbl.setAttribute('for', 'cb-' + m.id);
    lbl.textContent = m.n;

    row.appendChild(mcb);
    row.appendChild(lbl);
    kommuneDiv.appendChild(row);
  });

  header.addEventListener('click', e => {
    if (e.target === cb) return;
    const isOpen = kommuneDiv.classList.contains('open');
    kommuneDiv.classList.toggle('open', !isOpen);
    chev.classList.toggle('open', !isOpen);
  });

  div.appendChild(header);
  div.appendChild(kommuneDiv);
  container.appendChild(div);
});
