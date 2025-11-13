# 🎰 Baccarat - Wackarat

Et interaktivt Baccarat-spill bygget med React, Vite og Tailwind CSS.

## ✨ Funksjoner

- 🎮 **Komplett Baccarat-spill** med korrekte spillregler
- 💰 **Chips-system** med valgfrie innsatsbeløp (10, 25, 50, 100, 250, 500, 1000 kr)
- 📊 **Statistikk** - Spor seiere, tap, vinnerate og netto resultat
- 🎨 **Forbedret UI** med smooth animasjoner og moderne design
- 🎯 **Visuell feedback** - Vinnende hånd markeres med gyllen border og krone
- 🎉 **Confetti-animasjon** ved seier
- 📜 **Detaljert historikk** - Se alle tidligere runder med poeng og utbetalinger
- 🃏 **Realistisk kortdesign** med suit-symboler og verdier
- ⏱️ **Kontrollert tempo** - Avslappende ventetider mellom korttrekking

## 🚀 Komme i gang

### Forutsetninger

- Node.js (v18 eller nyere)
- npm eller yarn

### Installasjon

1. Klon repositoryet:
```bash
git clone https://github.com/mnytroe/Wackarat.git
cd Wackarat
```

2. Installer avhengigheter:
```bash
npm install
```

3. Start utviklingsserveren:
```bash
npm run dev
```

4. Åpne nettleseren og gå til `http://localhost:3000`

## 🎲 Hvordan spille

1. **Velg innsats** - Klikk på et av chip-verdiene (10, 25, 50, 100, 250, 500, 1000 kr)
2. **Plasser veddemål** - Velg mellom:
   - 👤 **Spiller** (1:1 utbetaling)
   - 🏦 **Banker** (19:20 utbetaling, 5% kommisjon)
   - 🤝 **Uavgjort** (8:1 utbetaling)
3. **Følg spillet** - Kort deles ut automatisk med animasjoner
4. **Se resultatet** - Vinnende hånd markeres, og saldo oppdateres automatisk

## 📋 Spillregler

- **Natural win**: Hvis spiller eller banker får 8 eller 9 med de første to kortene, vinner den høyeste
- **Spiller trekker**: Hvis spiller har 5 eller mindre, trekkes et tredje kort
- **Banker trekker**: Basert på komplekse regler avhengig av spillerens tredje kort
- **Vinner**: Den hånden med høyest poeng (modulo 10) vinner

## 🛠️ Teknologier

- **React 18** - UI-bibliotek
- **Vite** - Build tool og dev server
- **Tailwind CSS** - Styling
- **Framer Motion** - Animasjoner
- **Lucide React** - Ikoner

## 📦 Build for produksjon

```bash
npm run build
```

Bygde filer vil være i `dist/` mappen.

## 📝 Lisens

Dette prosjektet er åpent kildekode.

## 👤 Forfatter

mnytroe

---

Lykke til med spillet! 🎰

