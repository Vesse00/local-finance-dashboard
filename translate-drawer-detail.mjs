import fs from 'fs';

const filePath = 'd:/Code/PersonalData/local-finance-dashboard/src/app/drawer/page.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const replacements = [
  ['<label className="text-xs font-bold text-zinc-500 uppercase">Koszt</label>', '<label className="text-xs font-bold text-zinc-500 uppercase">{t("drawer_page.cost_label")}</label>'],
  ['<p className="text-xs text-amber-600 dark:text-amber-400 mb-2">Automatycznie dodaj wydatek na podaną kwotę do kalendarza finansowego.</p>', '<p className="text-xs text-amber-600 dark:text-amber-400 mb-2">{t("drawer_page.create_expense")}</p>'],
  ['Cyklicznie (Abonament)', '{t("drawer_page.recurring_billing")}'],
  ['Jednorazowo', '{t("drawer_page.one_time_billing")}']
];

for (const [search, replace] of replacements) {
    if(content.includes(search)) {
        content = content.replaceAll(search, replace);
    } else {
        console.log("Could not find:", search);
    }
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Drawer translation fine details done!");