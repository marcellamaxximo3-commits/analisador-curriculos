const $ = id => document.getElementById(id);
const MAX = 5 * 1024 * 1024;
let file = null;

const DEMO = {
  nome: "Ana Souza (exemplo)", email: "ana.souza@exemplo.com", telefone: "(11) 91234-5678",
  cargo_alvo: "Analista de Marketing", nota: 72,
  resumo: "Profissional com 5 anos em marketing digital, boa evolução de carreira e resultados mensuráveis em parte das experiências.",
  pontos_positivos: ["Crescimento consistente de cargo em 3 empresas", "Resultados com números (aumento de 38% em leads)", "Domínio de ferramentas de mídia paga e analytics"],
  pontos_negativos: ["Resumo profissional genérico", "Sem datas de saída em dois empregos", "Nenhum link de portfólio ou LinkedIn"],
  ia: { probabilidade: 45, justificativa: "O resumo e a descrição do último cargo usam frases muito genéricas e sem detalhes concretos.", trechos: ["Profissional proativa e orientada a resultados, com sólida experiência em estratégias inovadoras."] },
  vale_conversar: { decisao: "sim", justificativa: "Perfil compatível com vagas plenas e resultados reais; vale uma conversa para validar os números e as lacunas de datas.", perguntas: ["Como você chegou aos 38% de aumento em leads?", "O que aconteceu entre 2021 e 2022?"] }
};

function pick(f) {
  $("err").classList.add("hidden");
  if (!f) return;
  if (f.type !== "application/pdf" && !/\.pdf$/i.test(f.name)) return fail("Envie um arquivo PDF.");
  if (f.size > MAX) return fail("O arquivo passa de 5 MB.");
  file = f; $("fname").textContent = f.name; $("go").disabled = false;
}
function fail(m) { $("err").textContent = m; $("err").classList.remove("hidden"); file = null; $("go").disabled = true; }

const drop = $("drop");
drop.onclick = () => $("file").click();
drop.onkeydown = e => (e.key === "Enter" || e.key === " ") && $("file").click();
$("file").onchange = e => pick(e.target.files[0]);
drop.ondragover = e => { e.preventDefault(); drop.classList.add("over"); };
drop.ondragleave = () => drop.classList.remove("over");
drop.ondrop = e => { e.preventDefault(); drop.classList.remove("over"); pick(e.dataTransfer.files[0]); };
$("again").onclick = () => { $("result").classList.add("hidden"); $("upload").classList.remove("hidden"); file = null; $("file").value = ""; $("fname").textContent = "Somente PDF, até 5 MB"; $("go").disabled = true; };

$("go").onclick = async () => {
  const url = (window.APP_CONFIG || {}).WEBHOOK_URL;
  $("go").disabled = true; $("status").textContent = "Analisando… pode levar até 30 segundos";
  try {
    let data, demo = false;
    if (!url) { await new Promise(r => setTimeout(r, 1200)); data = DEMO; demo = true; }
    else {
      const fd = new FormData(); fd.append("file", file, file.name);
      const r = await fetch(url, { method: "POST", body: fd });
      if (!r.ok) throw new Error("O servidor respondeu " + r.status);
      data = await r.json();
    }
    render(data, demo);
  } catch (e) { fail("Não foi possível analisar: " + e.message); }
  $("status").textContent = ""; $("go").disabled = !file;
};

const color = n => n >= 70 ? "var(--ok)" : n >= 45 ? "var(--warn)" : "var(--bad)";
const fill = (id, arr) => { const ul = $(id); ul.innerHTML = ""; (arr || []).forEach(t => { const li = document.createElement("li"); li.textContent = t; ul.appendChild(li); }); };

function render(d, demo) {
  const nota = Math.max(0, Math.min(100, Math.round(+d.nota || 0)));
  const sc = $("score"); sc.style.setProperty("--p", nota); sc.style.setProperty("--c", color(nota)); $("scoreN").textContent = nota;
  $("nome").textContent = d.nome || "Nome não identificado";
  $("cargo").textContent = d.cargo_alvo || "";
  const em = $("email"); em.textContent = d.email || "e-mail não encontrado"; em.href = d.email ? "mailto:" + d.email : "#";
  $("tel").textContent = d.telefone ? " · " + d.telefone : "";
  const v = (d.vale_conversar || {}), dec = ["sim", "talvez", "nao"].includes(v.decisao) ? v.decisao : "talvez";
  const vt = $("verdict"); vt.className = "verdict v-" + dec;
  vt.textContent = { sim: "Vale conversar", talvez: "Talvez vale conversar", nao: "Não vale conversar" }[dec];
  $("resumo").textContent = d.resumo || "";
  fill("pos", d.pontos_positivos); fill("neg", d.pontos_negativos);
  const ia = d.ia || {}, p = Math.max(0, Math.min(100, Math.round(+ia.probabilidade || 0)));
  const bar = $("aiBar"); bar.style.setProperty("--c", p >= 60 ? "var(--bad)" : p >= 35 ? "var(--warn)" : "var(--ok)"); $("aiFill").style.width = p + "%";
  $("aiTxt").textContent = p + "% de chance de partes do texto terem sido geradas por IA. " + (ia.justificativa || "");
  const q = $("aiQuotes"); q.innerHTML = ""; (ia.trechos || []).forEach(t => { const b = document.createElement("blockquote"); b.textContent = t; q.appendChild(b); });
  $("why").textContent = v.justificativa || "";
  fill("qs", v.perguntas); $("qWrap").classList.toggle("hidden", !(v.perguntas || []).length);
  $("demo").classList.toggle("hidden", !demo);
  $("upload").classList.add("hidden"); $("result").classList.remove("hidden");
  window.scrollTo({ top: 0 });
}
