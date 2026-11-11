# BIM Studio

Aplicație web de proiectare BIM pentru calculator, iPad și telefon. Se instalează ca aplicație (PWA) și funcționează offline. Proiectele rămân pe dispozitiv, în browser.

## Proiectare (pagina principală)
- **Desen în plan pe niveluri**: pereți, uși, ferestre, stâlpi, grinzi, plăci, acoperișuri (terasă, o apă, două ape), zone (camere) și cote.
  - Punctele se prind automat de capete, colțuri, mijloace și fețe de pereți.
  - Lungimile și unghiurile exacte se tastează: `4.5` + Enter sau `4.5<90`.
  - Shift desenează doar orizontal sau vertical.
  - Camerele și plăcile se pot detecta automat, cu un clic în interiorul pereților.
- **Editare**: selecție (și cu dreptunghi), mutare, editarea capetelor (pereții legați se întind împreună), copiere, ștergere, anulare/refacere, niveluri cu cote și înălțimi.
- **3D generat automat**, alături de plan sau pe tot ecranul.
- **Proprietăți**: grosimi, înălțimi, materiale, portant/neportant, folosința planșeelor, straturi permanente.
- **Structuri pe straturi** (ca în ARCHICAD):
  - pereți exteriori cu termosistem (BCA/Porotherm/beton + EPS/vată + tencuieli), pereți interiori tencuiți, gips-carton;
  - plăci pe sol, planșee cu fonoizolație, terase, balcoane;
  - acoperiș cu țiglă, folie, șarpantă, vată și gips-carton.
  Planul arată straturile, iar 3D-ul și IFC-ul le exportă ca seturi de straturi de material.
- **Finisaje pe camere**: pardoseală (gresie, parchet…), plintă, pereți (glet + vopsea sau faianță până la o înălțime), tavan.
- **Fundații**: continue sub pereți și izolate sub stâlpi, generate automat din meniu (lățimi din calculul de sarcini) sau desenate.
- **Tâmplărie cu marcaje** (F1, U1 …) afișate pe plan, cu material, vitraj și Uw.
- **Antemăsurătoare** pe capitole de deviz:
  - terasamente, fundații, beton armat, zidării, acoperiș, izolații, tâmplărie, finisaje, pardoseli;
  - detalierea calculului pe fiecare element;
  - coduri de articol și prețuri unitare, salvate în proiect.
- **Export Excel (.xlsx)** cu formule și totaluri (inclusiv TVA). Foi: Antemăsurătoare, Detaliere, Tâmplărie, Camere, Elemente, Niveluri. Se poate exporta și CSV.
- **Calcul sarcini (orientativ, predimensionare)** după SR EN 1990 / 1991-1-1 / 1991-1-3:
  - greutate proprie, încărcări utile pe categorii, pereți despărțitori și zăpadă;
  - arii aferente și coborârea încărcărilor nivel cu nivel până la fundații, cu combinațiile SLU și SLS;
  - verificări orientative pentru zidărie, stâlpi, grinzi și plăci, plus lățimea fundațiilor;
  - afișare colorată pe plan și export CSV.
  - Nu include seismul și vântul și nu înlocuiește proiectul de rezistență semnat de un inginer atestat.
- **Dimensionarea grinzilor** (predimensionare, din calculul de sarcini). Pentru fiecare grindă propune:
  - **oțel:** cel mai ușor **IPE, HEA și HEB** în S235 sau S355 (încovoiere, forfecare, săgeată L/250; SR EN 1993-1-1);
  - **beton armat C25/30:** secțiunea b × h, armătura de jos (n Ø) și etrierii (SR EN 1992-1-1);
  - **lemn lamelar GL24h:** secțiunea b × h (SR EN 1995-1-1).
  Butonul „Aplică” schimbă grinda din model. Profilele de oțel apar cu secțiune I în 3D și ca `IfcIShapeProfileDef` în IFC, iar în antemăsurătoare se trec la kg.
- **Export IFC4** (pereți cu goluri, uși, ferestre, plăci, stâlpi, grinzi, acoperișuri, spații, materiale, Pset-uri, cantități) pentru ARCHICAD, Revit, Allplan etc. Butonul **Model 3D** deschide modelul direct în vizualizator.
- **Pe iPad și telefon**:
  - Desenezi cu degetul sau cu Apple Pencil. Punctul se pune la ridicarea degetului și apare deasupra degetului, ca să-l vezi.
  - Zoom și deplasare cu două degete.
  - Bara de desen are câmpuri pentru lungime și unghi și butoanele Gata / Închide conturul / Anulează.
  - Proprietățile apar într-un panou care urcă de jos.

## Vizualizator 3D (`viewer/`)
- **Import IFC** (2x3 / 4) din ARCHICAD, Revit, Allplan, Tekla etc. Fișierul se procesează local (WebAssembly) și rămâne salvat pe dispozitiv. Se poate deschide și prin link: `viewer/?ifc=<adresă fișier .ifc>`.
- **Fișiere BIMx** (`.bimx` publicate din ARCHICAD): planșele 2D, proprietățile elementelor și datele proiectului. Modelul 3D din BIMx are un format închis și nu se afișează.
- **Navigare**:
  - 3D;
  - mers prin clădire, cu joystick sau W A S D, coliziuni, scări și minihartă;
  - planuri 2D pe niveluri, cu pereții tăiați hașurați. Dublu-tap pe plan te duce în 3D în acel loc.
- **Unelte**:
  - proprietăți IFC, secțiuni, măsurători;
  - notițe cu export CSV, vederi salvate;
  - rază X, izolare, straturi și căutare.

## Publicare
1. Pe GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. La fiecare push pe `main`, workflow-ul `.github/workflows/pages.yml` publică folderul `app/`.
3. Aplicația e la `https://<utilizator>.github.io/bim-studio/`. Pe iPad/iPhone: Safari → Partajează → Adaugă pe ecranul principal.

## Rulare locală
```bash
cd app && python3 -m http.server 8000
# deschide http://localhost:8000
```
