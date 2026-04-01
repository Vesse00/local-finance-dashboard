import fs from 'fs';

const filePath = 'd:/Code/PersonalData/local-finance-dashboard/src/components/health/energy-form.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

if (!content.includes('useLanguage')) {
    content = content.replace(
        'import { deleteEnergyEntry } from "@/lib/actions";',
        'import { deleteEnergyEntry } from "@/lib/actions";\nimport { useLanguage } from "@/components/LanguageProvider";'
    );
}

const replacements = [
  ['"Wyczerpanie"', 't("health_energy.state_1")'],
  ['"Niski Poziom"', 't("health_energy.state_2")'],
  ['"W Normie"', 't("health_energy.state_3")'],
  ['"Pełny Bak"', 't("health_energy.state_4")'],
  ['"Overcharged"', 't("health_energy.state_5")'],
];

for (const [search, replace] of replacements) {
    if(content.includes(search)) {
        content = content.replaceAll(search, replace);
    } else {
        console.log("Could not find:", search);
    }
}

// We need to pass `t` from `EnergyForm` to `getZenConfig` or make `getZenConfig` defined inside `OrganicSelector` where `t` is available.
// Or just let's modify the component directly using regex.

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Energy form translation script generated!");
