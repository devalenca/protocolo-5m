import type { ReactNode } from "react";

export type ProtocolSection = {
  num: string;
  title: string;
  body: ReactNode;
};

export const PROTOCOL_SECTIONS: ProtocolSection[] = [
  {
    num: "01",
    title: "Metas diárias",
    body: (
      <ul className="space-y-1.5">
        <li><strong>Calorias:</strong> 2.350 kcal</li>
        <li><strong>Proteína:</strong> 170g <span className="text-text-mute">(prioridade máxima)</span></li>
        <li><strong>Carboidrato:</strong> 245g</li>
        <li><strong>Gordura:</strong> 70g</li>
        <li><strong>Água:</strong> 3 litros</li>
        <li><strong>Sono:</strong> 7h+ (deitar até 22h30)</li>
      </ul>
    ),
  },
  {
    num: "02",
    title: "Dieta · presencial",
    body: (
      <div className="space-y-4">
        <Meal title="06:30 · Café no escritório">
          <p className="text-text-dim mb-2 text-sm">
            <strong>Overnight oats proteico</strong> — preparado na noite anterior. ~540 kcal · 38g proteína.
          </p>
          <Bullets items={[
            "60g aveia em flocos",
            "200ml leite desnatado",
            "30g whey (1 scoop)",
            "15g pasta de amendoim",
            "1 banana fatiada",
            "5g chia ou linhaça + canela",
          ]} />
        </Meal>
        <Meal title="10:00 · Lanche">
          <Bullets items={[
            "170g iogurte natural + 15g whey",
            "1 maçã ou pera",
            "20g mix de castanhas",
          ]} />
        </Meal>
        <Meal title="12:30 · Almoço">
          <Bullets items={[
            "180g frango grelhado (cru)",
            "120g arroz cozido + 80g feijão",
            "Salada à vontade + 10ml azeite",
            "1 fruta",
          ]} />
        </Meal>
        <Meal title="16:30 · Lanche / Pré-treino">
          <Bullets items={[
            "2 fatias pão integral",
            "100g frango desfiado + queijo branco",
            "1 banana",
          ]} />
        </Meal>
        <Meal title="21:00 · Jantar pós-treino">
          <Bullets items={[
            "180g carne magra ou frango",
            "200g batata-doce",
            "150g legumes refogados",
          ]} />
        </Meal>
        <Meal title="22:00 · Pré-sono">
          <Bullets items={["Chá calmante + 400mg magnésio bisglicinato"]} />
        </Meal>
      </div>
    ),
  },
  {
    num: "03",
    title: "Dieta · home office",
    body: (
      <div className="space-y-4">
        <Meal title="04:30 · Café tradicional">
          <Bullets items={[
            "3 ovos mexidos (2 inteiros + 1 clara)",
            "2 fatias pão integral + 15g pasta de amendoim",
            "1 banana + café preto",
          ]} />
        </Meal>
        <Meal title="09:00 · Lanche">
          <Bullets items={[
            "30g whey + 200ml leite",
            "1 fruta + 25g castanhas",
          ]} />
        </Meal>
        <Meal title="11:00 · Pré-treino">
          <Bullets items={[
            "1 banana + 15g pasta de amendoim + café",
            "Sem Évora — só café basta",
          ]} />
        </Meal>
        <Meal title="13:30 · Almoço pós-treino">
          <Bullets items={[
            "200g frango ou carne",
            "150g arroz + 80g feijão",
            "Salada + azeite + 1 fruta",
          ]} />
        </Meal>
        <Meal title="16:30 · Pote proteico">
          <Bullets items={["170g iogurte + 15g whey + 30g aveia + canela"]} />
        </Meal>
        <Meal title="19:30 · Jantar leve">
          <Bullets items={[
            "150g carne ou frango",
            "100g batata-doce",
            "150g legumes + azeite",
          ]} />
        </Meal>
      </div>
    ),
  },
  {
    num: "04",
    title: "Suplementação",
    body: (
      <div className="space-y-4">
        <Meal title="Diários">
          <Bullets items={[
            "Creatina 5g · qualquer horário",
            "Whey 30g × 2 · lanches",
            "Vit D3 2-4k UI · com almoço",
            "Ômega 3 2g EPA+DHA · com almoço",
            "Magnésio bisglicinato 400mg · antes de dormir",
            "Zinco quelato 15mg · com jantar",
            "Ashwagandha KSM-66 600mg · ciclo 12 on / 4 off",
          ]} />
        </Meal>
        <Meal title="Pré-treino">
          <Bullets items={[
            "Beta-alanina 3-5g · só dias sem Évora",
            "Évora XT ½-1 dose · máx 3×/sem · NUNCA após 16h",
          ]} />
        </Meal>
        <Meal title="Evitar">
          <Bullets items={["Tribulus, ZMA, 'testo boosters', BCAA, glutamina"]} />
        </Meal>
      </div>
    ),
  },
  {
    num: "05",
    title: "Marcas e onde comprar",
    body: (
      <div className="space-y-4">
        <Meal title="Suplementos">
          <Bullets items={[
            "Whey: Growth, Dux, Probiótica (R$ 130-180/kg)",
            "Creatina: Growth Creapure 300g (R$ 100-130)",
            "Ômega 3: Vitafor, Essential (≥1000mg EPA+DHA)",
            "Magnésio: Vitafor, Puravida (bisglicinato)",
            "Ashwagandha: KSM-66 ou Sensoril no rótulo",
          ]} />
        </Meal>
        <Meal title="Alimentos">
          <Bullets items={[
            "Aveia, castanhas, chia: SEMPRE a granel",
            "Carne: açougue de bairro",
            "Hortifruti: feira de sábado",
            "Despensa: Atacadão / Assaí (mensal)",
            "Azeite: Andorinha, Gallo, Borges",
            "Pão integral 100%: Wickbold Grãos, Seven Boys",
          ]} />
        </Meal>
        <Meal title="Onde comprar suplementos">
          <p className="text-text-dim text-sm">
            Site Growth, Netshoes, Centauro.{" "}
            <strong className="text-text">Evite Mercado Livre sem reputação.</strong>
          </p>
        </Meal>
      </div>
    ),
  },
  {
    num: "06",
    title: "Os não-negociáveis",
    body: (
      <ol className="text-text space-y-2">
        <li><strong className="text-brand">1.</strong> Deita até 22h30. Magnésio na cabeceira, sem tela.</li>
        <li><strong className="text-brand">2.</strong> 170g de proteína todo dia.</li>
        <li><strong className="text-brand">3.</strong> Anota cargas e progride semana a semana.</li>
        <li><strong className="text-brand">4.</strong> Café da manhã não-negociável (deixa preparado).</li>
        <li><strong className="text-brand">5.</strong> Évora só de manhã. Máx 3×/sem. Nunca após 16h.</li>
      </ol>
    ),
  },
  {
    num: "07",
    title: "Faça os exames",
    body: (
      <>
        <p className="text-text-dim mb-3 text-sm">Idealmente nas próximas 2 semanas:</p>
        <Bullets items={[
          "Testosterona total e livre",
          "SHBG",
          "Vitamina D (25-OH)",
          "Ferritina",
          "TSH e T4 livre",
          "Hemograma",
          "Glicemia jejum + HbA1c",
        ]} />
        <p className="text-text-dim mt-3 text-sm">
          Se algo estiver baixo, suplemento natural não resolve — procure endocrinologista.
        </p>
      </>
    ),
  },
];

function Meal({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-brand mb-1.5 font-serif text-[15px] font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="text-text-soft list-disc space-y-1 pl-5 text-sm leading-snug">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}
