import { Button } from "./Button.jsx";
import { Panel } from "./Panel.jsx";

export function RulesScreen({ back }) {
  return (
    <div className="app">
      <div className="container narrow">
        <div className="topbar">
          <div>
            <h1>Pravidla CardBoxu</h1>
            <p>Digitální pravidla aktuální testovací verze.</p>
          </div>
          <Button onClick={back} variant="secondary">
            Zpět do menu
          </Button>
        </div>

        <Panel className="rules">
          <h2>Cíl hry</h2>
          <p>
            Sniž soupeřův deck na nulu, nebo měj po 6 kolech méně vyložených
            karet na stole než soupeř.
          </p>

          <h2>Základní princip</h2>
          <p>
            Hráči se střídají v útocích, blocích a pauzách. Útok buď projde a
            způsobí damage, nebo je zablokován figurou. Vyložené karty zůstávají
            na stole a později se mohou vrátit do decku pomocí recovery.
          </p>

          <h2>Průběh kola</h2>
          <ol>
            <li>Iniciativa</li>
            <li>Mulligan — pouze v prvním kole</li>
            <li>Útoky, bloky a pauzy</li>
            <li>Recovery</li>
            <li>Další kolo</li>
          </ol>

          <h2>Iniciativa</h2>
          <p>
            Na začátku každého kola oba hráči odhalí jednu kartu. Vyšší karta
            získává iniciativu a její hráč začíná jako útočník.
          </p>
          <p>
            Při remíze oba hráči odhalí další kartu, dokud není určen vítěz
            iniciativy.
          </p>

          <h2>Mulligan</h2>
          <p>Mulligan probíhá pouze v prvním kole po určení iniciativy.</p>
          <ul>
            <li>Každý hráč může odhodit libovolný počet karet z ruky.</li>
            <li>Nelze odhodit kartu nebo karty použité pro iniciativu.</li>
            <li>Odhozené karty se zamíchají zpět do decku.</li>
            <li>Hráč si poté dolízne zpět do 8 karet.</li>
          </ul>

          <h2>Útok</h2>
          <p>Útok může být jab nebo combo.</p>
          <ul>
            <li>Jab je útok jednou kartou.</li>
            <li>Combo je útok více kartami stejného suitu v postupce.</li>
            <li>Eso může být nízké i vysoké: A-2-3 i Q-K-A jsou platné.</li>
            <li>Karty použité k útoku se vyloží na stůl útočníka.</li>
          </ul>

          <h2>Damage</h2>
          <ul>
            <li>Jab způsobí 2 damage.</li>
            <li>Combo způsobí 3 damage za každou kartu v combu.</li>
          </ul>

          <table>
            <thead>
              <tr>
                <th>Útok</th>
                <th>Damage</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1 karta</td>
                <td>2</td>
              </tr>
              <tr>
                <td>2 karty</td>
                <td>6</td>
              </tr>
              <tr>
                <td>3 karty</td>
                <td>9</td>
              </tr>
              <tr>
                <td>4 karty</td>
                <td>12</td>
              </tr>
              <tr>
                <td>5 karet</td>
                <td>15</td>
              </tr>
            </tbody>
          </table>

          <h2>Střídání barev</h2>
          <p>
            Po zásahu nebo bloku musí další útok použít opačnou barvu než
            předchozí útok nebo blok.
          </p>
          <ul>
            <li>Černá: piky a kříže.</li>
            <li>Červená: srdce a káry.</li>
          </ul>

          <h2>Blok</h2>
          <p>
            Obránce může útok zablokovat jednou figurou. Blokující karta se
            vyloží na stůl obránce.
          </p>

          <table>
            <thead>
              <tr>
                <th>Figura</th>
                <th>Blokuje</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>J</td>
                <td>jab</td>
              </tr>
              <tr>
                <td>Q</td>
                <td>combo do 2 karet</td>
              </tr>
              <tr>
                <td>K</td>
                <td>combo do 3 karet</td>
              </tr>
              <tr>
                <td>A</td>
                <td>libovolný útok</td>
              </tr>
            </tbody>
          </table>

          <p>
            Úspěšný blok neguje damage a obránce okamžitě přebírá iniciativu.
            Jeho první útok musí být opačné barvy než blokující figura.
          </p>

          <h2>Pauza</h2>
          <p>
            Útočník může místo útoku dát pauzu. Při pauze si dolízne do 8 karet
            a iniciativa přechází na soupeře.
          </p>
          <p>
            Třetí pauza v jednom kole ukončí kolo a spustí recovery. Pauzy obou
            hráčů se počítají dohromady.
          </p>

          <h2>Recovery</h2>
          <p>
            Po skončení kola recoverují oba hráči postupně. Hráč vybere jeden
            suit a všechny své vyložené karty tohoto suitu zamíchá zpět do
            svého decku.
          </p>
          <p>Po recovery si hráč dolízne do 8 karet, pokud může.</p>

          <h2>KO</h2>
          <p>
            Pokud má hráč dostat damage, ale nemá v decku dost karet k jeho
            absorbování, prohrává okamžitě na KO.
          </p>

          <h2>Konec hry</h2>
          <p>Hra končí okamžitě KO, nebo po 6. kole.</p>
          <p>
            Pokud nikdo není KO, vyhrává hráč s menším počtem vyložených karet
            na stole. Při shodě nastává remíza.
          </p>

          <h2>AI soupeři</h2>
          <ul>
            <li>Sparring partner hraje jednodušší, přímočařejší strategii.</li>
            <li>
              Muhammad AI šetří figury, hledá okna pro combo a zohledňuje deck,
              ruku i pravděpodobnost soupeřova bloku.
            </li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}
