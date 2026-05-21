# Inspreek app

Een kleine webapp om spraak op te nemen, naar tekst om te zetten, de tekst aan te passen en daarna als Outlook-concept te openen.

## Starten

```powershell
python -m http.server 8080
```

Open daarna:

```text
http://localhost:8080/index.html
```

Gebruik Microsoft Edge of Chrome, omdat de app de browserfunctie voor spraakherkenning gebruikt.

## Vooraf ingesteld adres

Pas in `app.js` deze regel aan:

```js
const DEFAULT_RECIPIENT = "ontvanger@example.com";
```

Je kunt het adres ook in de app zelf wijzigen. Dat wordt lokaal in de browser onthouden.

## Outlook

De knop **Open in Outlook** opent via `mailto:` een nieuw mailconcept met ontvanger, onderwerp en tekst ingevuld. Zet Outlook in Windows als standaard mail-app als je wilt dat dit direct in Outlook opent. De browser mag zonder Microsoft Graph-koppeling niet stilletjes namens jou e-mail verzenden, dus de laatste verzendbevestiging gebeurt in Outlook.

## Vaktermen

De app corrigeert na elke opname veelvoorkomende termen uit verhuur, industrie, kabels en las-equipment. Breid in `app.js` de lijst `DOMAIN_CORRECTIONS` uit met woorden die jullie vaak gebruiken of die de browser verkeerd verstaat.
