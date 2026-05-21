import { Button } from "./Button.jsx";
import { Panel } from "./Panel.jsx";

export function RulesScreen({ back }) {
  return (
    <div className="app">
      <div className="container narrow">
        <div className="topbar">
          <div>
            <h1>Pravidla Karetního Boxu</h1>
            <p>Kompletní aktuální pravidla prototypu.</p>
          </div>
          <Button onClick={back} variant="secondary">Zpět do menu</Button>
        </div>

        <Panel className="rules">
          <h2>1. Cíl hry</h2>
          <p>Karetní Box je duelová karetní hra pro dva hráče. Hraje se na 6 kol. Vyhrává hráč, který má po skončení šestého kola před sebou méně vyložených karet. Hráč může vyhrát také okamžitě knockoutem.</p>

          <h2>2. Komponenty</h2>
          <ul>
            <li>Každý hráč používá vlastní standardní balíček 52 karet.</li>
            <li>Žolíky se nepoužívají.</li>
            <li>Každý hráč má vlastní ruku, vlastní balíček a vlastní vyložené karty.</li>
          </ul>

          <h2>3. Hodnoty karet</h2>
          <p>Pořadí hodnot je: A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A.</p>
          <p>Eso může být použito jako nejnižší karta v postupce A-2-3 nebo jako nejvyšší karta v postupce Q-K-A. Postupky nejsou cyklické; K-A-2 není platná postupka.</p>

          <h2>4. Začátek hry a kola</h2>
          <ul>
            <li>Na začátku hry si každý hráč lízne do 8 karet.</li>
            <li>Na začátku každého kola oba hráči současně odhalí jednu kartu z ruky.</li>
            <li>Hráč s vyšší odhalenou kartou začíná jako útočník.</li>
            <li>Eso se při určení iniciativy počítá jako nejvyšší karta.</li>
            <li>Při shodě rozhodne náhodný výběr.</li>
            <li>Odhalené karty se vracejí zpět do ruky.</li>
          </ul>

          <h2>5. Útok</h2>
          <p>Hráč na tahu je útočník. Útočník může zahrát jednu kartu nebo více karet.</p>
          <ul>
            <li>Jedna karta je vždy platný útok.</li>
            <li>Více karet musí být stejného suitu.</li>
            <li>Více karet musí tvořit souvislou postupku.</li>
            <li>Všechny zahrané útočné karty se ihned vyloží před útočníka lícem vzhůru.</li>
          </ul>
          <p><strong>Příklady platných útoků:</strong> 7, 4-5, 8-9-10, 10-J-Q, Q-K-A, A-2-3.</p>
          <p><strong>Příklady neplatných útoků:</strong> 7-9, 10-Q-K, K-A-2, postupka z různých suitů.</p>

          <h2>6. Damage</h2>
          <ul>
            <li>Jednokaretní útok je jab a způsobí 2 damage.</li>
            <li>Útok dvěma nebo více kartami způsobí 3 damage za každou zahranou kartu.</li>
          </ul>
          <table>
            <thead><tr><th>Útok</th><th>Damage</th></tr></thead>
            <tbody>
              <tr><td>1 karta</td><td>2</td></tr>
              <tr><td>2 karty</td><td>6</td></tr>
              <tr><td>3 karty</td><td>9</td></tr>
              <tr><td>4 karty</td><td>12</td></tr>
              <tr><td>5 karet</td><td>15</td></tr>
            </tbody>
          </table>

          <h2>7. Blok</h2>
          <p>Obránce může útok zablokovat zahráním jedné figury libovolného suitu.</p>
          <table>
            <thead><tr><th>Figura</th><th>Blokuje útok do velikosti</th></tr></thead>
            <tbody>
              <tr><td>J</td><td>1 karta</td></tr>
              <tr><td>Q</td><td>2 karty</td></tr>
              <tr><td>K</td><td>3 karty</td></tr>
              <tr><td>A</td><td>libovolně dlouhý útok</td></tr>
            </tbody>
          </table>
          <ul>
            <li>Blokující figura se vyloží před obránce lícem vzhůru.</li>
            <li>Úspěšný blok vždy okamžitě převádí iniciativu na obránce.</li>
            <li>Nový útočník musí svůj první útok zahrát opačnou barvou než byla blokující figura.</li>
          </ul>

          <h2>8. Nezablokovaný útok</h2>
          <p>Pokud obránce útok nezablokuje, odloží ze svého balíčku počet karet odpovídající damage útoku. Tyto karty vyloží před sebe lícem vzhůru.</p>
          <p>Po úspěšném zásahu zůstává útočník na tahu a může pokračovat dalším útokem.</p>

          <h2>9. Střídání barev</h2>
          <ul>
            <li>Po zásahu musí další útok útočníka být opačné barvy než předchozí útok.</li>
            <li>Červené suity jsou srdce a káry.</li>
            <li>Černé suity jsou piky a kříže.</li>
            <li>Po bloku musí nový útočník začít opačnou barvou než byla barva blokující figury.</li>
          </ul>

          <h2>10. Pauza</h2>
          <ul>
            <li>Útočník může místo dalšího útoku vyhlásit pauzu.</li>
            <li>Při pauze si hráč lízne do 8 karet, kolik může.</li>
            <li>Hráč nemůže být knockoutován vlastním lízáním.</li>
            <li>Po pauze se útočníkem stává soupeř.</li>
            <li>Třetí pauza celkem ukončí kolo. Pauzy obou hráčů se sčítají.</li>
          </ul>

          <h2>11. Recovery na konci kola</h2>
          <ul>
            <li>Jako první recoveruje hráč, který ukončil kolo třetí pauzou.</li>
            <li>Poté recoveruje druhý hráč.</li>
            <li>Každý hráč může vrátit do svého balíčku 0–5 svých vyložených karet.</li>
            <li>Všechny vracené karty musí být stejného suitu.</li>
            <li>Vrácené karty nemusí tvořit postupku.</li>
            <li>Vrácené karty se zamíchají zpět do balíčku.</li>
            <li>Poté si hráč lízne do 8 karet, kolik může.</li>
          </ul>

          <h2>12. KO</h2>
          <p>Hráč je knockoutován pouze tehdy, když má odhodit damage z útoku, ale nemá v balíčku dostatek karet. V takovém případě okamžitě prohrává.</p>

          <h2>13. Konec hry</h2>
          <ul>
            <li>Hra končí okamžitě KO.</li>
            <li>Pokud nedojde ke KO, hra končí po 6. kole.</li>
            <li>Po 6. kole vyhrává hráč s menším počtem vyložených karet.</li>
            <li>Při stejném počtu vyložených karet nastává remíza.</li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}
