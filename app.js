const API_URL = "https://script.google.com/macros/s/AKfycbxTRku4QGf6PvIZ0P8Rry1X8uPKtl0Er90eDVu1lwC-GM9RdTh2tS_V9s92Zfso5Gj9/exec";

let senhaSync = sessionStorage.getItem("bibliotecaSenhaSync") || "";
let timerSync = null;

async function chamarApi(acao, dados = null) {
  if (!senhaSync) {
    senhaSync = prompt("Digite a senha da biblioteca:") || "";

    if (!senhaSync) {
      throw new Error("Senha não informada.");
    }

    sessionStorage.setItem("bibliotecaSenhaSync", senhaSync);
  }

  const resposta = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({
      acao,
      senha: senhaSync,
      dados
    })
  });

  const resultado = await resposta.json();

  if (!resultado.ok) {
    if (resultado.erro === "Senha incorreta.") {
      sessionStorage.removeItem("bibliotecaSenhaSync");
      senhaSync = "";
    }

    throw new Error(resultado.erro || "Erro de sincronização.");
  }

  return resultado;
}const KEY = "bibliotecaEstudosLucianoV1";
const $ = id => document.getElementById(id);
const uid = () => crypto.randomUUID();

const inicial = {
  theme: "light",
  notes: [],
  materials: [
    {
      id: uid(),
      title: "Constituição Federal de 1988",
      category: "Direito Constitucional",
      description: "Texto constitucional atualizado no portal oficial da Presidência da República.",
      url: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm",
      source: "Planalto",
      status: "revisando",
      tags: ["constituição", "direitos fundamentais", "concurso"],
      note: "",
      favorite: true
    },
    {
      id: uid(),
      title: "Lei nº 9.394/1996 — LDB",
      category: "Legislação Educacional",
      description: "Lei de Diretrizes e Bases da Educação Nacional.",
      url: "https://www.planalto.gov.br/ccivil_03/leis/l9394.htm",
      source: "Planalto",
      status: "revisando",
      tags: ["educação", "LDB", "concurso"],
      note: "",
      favorite: true
    },
    {
      id: uid(),
      title: "Lei nº 13.146/2015 — LBI",
      category: "AEE e Inclusão",
      description: "Lei Brasileira de Inclusão da Pessoa com Deficiência.",
      url: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13146.htm",
      source: "Planalto",
      status: "revisando",
      tags: ["inclusão", "deficiência", "AEE"],
      note: "",
      favorite: true
    },
    {
      id: uid(),
      title: "Base Nacional Comum Curricular — BNCC",
      category: "Legislação Educacional",
      description: "Documento normativo da Educação Básica disponibilizado pelo Ministério da Educação.",
      url: "https://basenacionalcomum.mec.gov.br/",
      source: "MEC",
      status: "nao-iniciado",
      tags: ["BNCC", "competências", "habilidades"],
      note: "",
      favorite: false
    }
  ]
};

let state;
try {
  state = JSON.parse(localStorage.getItem(KEY)) || structuredClone(inicial);
} catch {
  state = structuredClone(inicial);
}

if (!Array.isArray(state.materials)) state.materials = [];
if (!Array.isArray(state.notes)) state.notes = [];

let view = "biblioteca";
let categoria = "todas";

function salvar() {
  localStorage.setItem(KEY, JSON.stringify(state));

  clearTimeout(timerSync);

  timerSync = setTimeout(async () => {
    try {
      await chamarApi("salvar", state);
      aviso("Sincronizado.");
    } catch (erro) {
      console.error(erro);
      aviso("Salvo neste navegador; sincronização pendente.");
    }
  }, 600);
}
async function carregarNuvem() {
  try {
    const resultado = await chamarApi("carregar");

    if (!resultado.dados) {
      throw new Error("Dados da nuvem não encontrados.");
    }

    state = resultado.dados;

    if (!Array.isArray(state.materials)) state.materials = [];
    if (!Array.isArray(state.notes)) state.notes = [];

    localStorage.setItem(KEY, JSON.stringify(state));

    document.documentElement.dataset.theme =
      state.theme || "light";

    render();
    aviso("Biblioteca sincronizada.");
  } catch (erro) {
    console.error(erro);
    aviso("Usando dados deste navegador.");
  }
}

function limpar(texto = "") {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function html(texto = "") {
  return String(texto).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[c]);
}

function statusNome(status) {
  return {
    "nao-iniciado": "Não iniciado",
    "revisando": "Revisando",
    "dominado": "Dominado"
  }[status] || status;
}

function aviso(texto) {
  const t = $("toast");
  t.textContent = texto;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 1800);
}

function estatisticas() {
  $("statMaterials").textContent = state.materials.length;
  $("statFavorites").textContent =
    state.materials.filter(m => m.favorite).length;

  $("statNotes").textContent =
    state.notes.length +
    state.materials.filter(m => (m.note || "").trim()).length;
}

function categorias() {
  const contagem = {};

  state.materials.forEach(m => {
    contagem[m.category] = (contagem[m.category] || 0) + 1;
  });

  const lista = Object.keys(contagem)
    .sort((a, b) => a.localeCompare(b, "pt-BR"));

  $("categoryList").innerHTML =
    `<button class="category-btn ${categoria === "todas" ? "active" : ""}"
      data-category="todas">
      <span>Todas</span>
      <span class="category-count">${state.materials.length}</span>
    </button>` +

    lista.map(c => `
      <button class="category-btn ${categoria === c ? "active" : ""}"
        data-category="${html(c)}">
        <span>${html(c)}</span>
        <span class="category-count">${contagem[c]}</span>
      </button>
    `).join("");

  $("categoryOptions").innerHTML =
    lista.map(c => `<option value="${html(c)}"></option>`).join("");

  document.querySelectorAll(".category-btn").forEach(btn => {
    btn.onclick = () => {
      categoria = btn.dataset.category;
      view = "biblioteca";
      render();
    };
  });
}

function filtrados() {
  const busca = limpar($("searchInput").value);
  const status = $("statusFilter").value;

  return state.materials.filter(m => {
    const texto = limpar([
      m.title,
      m.category,
      m.description,
      m.source,
      (m.tags || []).join(" "),
      m.note
    ].join(" "));

    return (!busca || texto.includes(busca)) &&
      (status === "todos" || m.status === status) &&
      (categoria === "todas" || m.category === categoria) &&
      (view !== "favoritos" || m.favorite);
  });
}

function materiais() {
  const lista = filtrados();

  $("cardGrid").innerHTML = lista.map(m => `
    <article class="card">

      <div class="card-top">
        <span class="badge">${html(m.category)}</span>

        <button
          class="favorite-btn ${m.favorite ? "active" : ""}"
          data-fav="${m.id}"
          title="Favoritar">
          ★
        </button>
      </div>

      <h3>${html(m.title)}</h3>

      <p class="card-description">
        ${html(m.description || "")}
      </p>

      ${(m.tags || []).length ? `
        <div class="tags">
          ${m.tags.map(t =>
            `<span class="tag">${html(t)}</span>`
          ).join("")}
        </div>
      ` : ""}

      ${m.note ? `
        <div class="card-note">${html(m.note)}</div>
      ` : ""}

      <div class="card-footer">

        <span class="status ${m.status}">
          ${statusNome(m.status)}
        </span>

        <div class="card-actions">

          ${m.url ? `
            <a
              class="card-link"
              href="${html(m.url)}"
              target="_blank"
              rel="noopener">
              Abrir
            </a>
          ` : ""}

          <button class="small-btn" data-edit="${m.id}">
            Editar
          </button>

          <button class="small-btn danger" data-del="${m.id}">
            Excluir
          </button>

        </div>
      </div>
    </article>
  `).join("");

  $("emptyState").classList.toggle("hidden", lista.length > 0);

  document.querySelectorAll("[data-fav]").forEach(btn => {
    btn.onclick = () => {
      const m = state.materials.find(x => x.id === btn.dataset.fav);
      m.favorite = !m.favorite;
      salvar();
      render();
    };
  });

  document.querySelectorAll("[data-edit]").forEach(btn => {
    btn.onclick = () => abrirMaterial(btn.dataset.edit);
  });

  document.querySelectorAll("[data-del]").forEach(btn => {
    btn.onclick = () => {
      const m = state.materials.find(x => x.id === btn.dataset.del);

      if (confirm(`Excluir "${m.title}"?`)) {
        state.materials =
          state.materials.filter(x => x.id !== m.id);

        salvar();
        render();
      }
    };
  });
}

function navegacao() {
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle(
      "active",
      btn.dataset.view === view
    );
  });

  if (view === "biblioteca") {
    $("viewTitle").textContent = "Biblioteca";
    $("viewSubtitle").textContent =
      "Centralize legislação, referências e materiais de estudo em um só lugar.";
  }

  if (view === "favoritos") {
    $("viewTitle").textContent = "Favoritos";
    $("viewSubtitle").textContent =
      "Acesse rapidamente seus materiais prioritários.";
  }

  if (view === "anotacoes") {
    $("viewTitle").textContent = "Anotações";
    $("viewSubtitle").textContent =
      "Registre revisões, conceitos, dúvidas e pegadinhas de prova.";
  }
}

function notas() {
  $("notesSection").classList.remove("hidden");
  $("cardGrid").classList.add("hidden");
  $("emptyState").classList.add("hidden");

  $("notesGrid").innerHTML = state.notes.length
    ? state.notes.map(n => `
      <article class="note-card">

        <h4>${html(n.title)}</h4>

        <div class="note-body">
          ${html(n.body)}
        </div>

        <div class="note-meta">

          <span>
            ${new Date(n.updatedAt).toLocaleDateString("pt-BR")}
          </span>

          <span>
            <button
              class="small-btn"
              data-editnote="${n.id}">
              Editar
            </button>

            <button
              class="small-btn danger"
              data-delnote="${n.id}">
              Excluir
            </button>
          </span>

        </div>
      </article>
    `).join("")
    : `
      <div class="empty-state">
        <h3>Nenhuma anotação</h3>
        <p>Crie sua primeira anotação.</p>
      </div>
    `;

  document.querySelectorAll("[data-editnote]").forEach(btn => {
    btn.onclick = () => abrirNota(btn.dataset.editnote);
  });

  document.querySelectorAll("[data-delnote]").forEach(btn => {
    btn.onclick = () => {
      const n = state.notes.find(x => x.id === btn.dataset.delnote);

      if (confirm(`Excluir "${n.title}"?`)) {
        state.notes =
          state.notes.filter(x => x.id !== n.id);

        salvar();
        render();
      }
    };
  });
}

function abrirMaterial(id = "") {
  $("materialForm").reset();
  $("materialId").value = "";

  $("materialDialogTitle").textContent =
    id ? "Editar material" : "Adicionar material";

  if (id) {
    const m = state.materials.find(x => x.id === id);

    $("materialId").value = m.id;
    $("titleInput").value = m.title || "";
    $("categoryInput").value = m.category || "";
    $("descriptionInput").value = m.description || "";
    $("urlInput").value = m.url || "";
    $("sourceInput").value = m.source || "";
    $("statusInput").value = m.status || "nao-iniciado";
    $("tagsInput").value = (m.tags || []).join(", ");
    $("materialNoteInput").value = m.note || "";
  }

  $("materialDialog").showModal();
}

function abrirNota(id = "") {
  $("noteForm").reset();
  $("noteId").value = "";

  $("noteDialogTitle").textContent =
    id ? "Editar anotação" : "Nova anotação";

  if (id) {
    const n = state.notes.find(x => x.id === id);

    $("noteId").value = n.id;
    $("noteTitleInput").value = n.title;
    $("noteBodyInput").value = n.body;
  }

  $("noteDialog").showModal();
}

$("materialForm").onsubmit = e => {
  e.preventDefault();

  const id = $("materialId").value;
  const antigo = state.materials.find(m => m.id === id);

  const material = {
    id: id || uid(),
    title: $("titleInput").value.trim(),
    category: $("categoryInput").value.trim(),
    description: $("descriptionInput").value.trim(),
    url: $("urlInput").value.trim(),
    source: $("sourceInput").value.trim(),
    status: $("statusInput").value,
    tags: $("tagsInput").value
      .split(",")
      .map(t => t.trim())
      .filter(Boolean),
    note: $("materialNoteInput").value.trim(),
    favorite: antigo ? antigo.favorite : false
  };

  if (id) {
    const i = state.materials.findIndex(m => m.id === id);
    state.materials[i] = material;
  } else {
    state.materials.unshift(material);
  }

  salvar();
  $("materialDialog").close();
  aviso("Material salvo.");
  render();
};

$("noteForm").onsubmit = e => {
  e.preventDefault();

  const id = $("noteId").value;

  const nota = {
    id: id || uid(),
    title: $("noteTitleInput").value.trim(),
    body: $("noteBodyInput").value.trim(),
    updatedAt: new Date().toISOString()
  };

  if (id) {
    const i = state.notes.findIndex(n => n.id === id);
    state.notes[i] = nota;
  } else {
    state.notes.unshift(nota);
  }

  salvar();
  $("noteDialog").close();
  aviso("Anotação salva.");
  render();
};

document.querySelectorAll(".nav-item").forEach(btn => {
  btn.onclick = () => {
    view = btn.dataset.view;
    categoria = "todas";
    render();
  };
});

document.querySelectorAll(".close-dialog").forEach(btn => {
  btn.onclick = () => $("materialDialog").close();
});

document.querySelectorAll(".close-note-dialog").forEach(btn => {
  btn.onclick = () => $("noteDialog").close();
});

$("addBtn").onclick = () => abrirMaterial();
$("newNoteBtn").onclick = () => abrirNota();

$("searchInput").oninput = render;
$("statusFilter").onchange = render;

$("themeBtn").onclick = () => {
  state.theme = state.theme === "dark"
    ? "light"
    : "dark";

  document.documentElement.dataset.theme = state.theme;

  salvar();
};

$("exportBtn").onclick = () => {
  const arquivo = new Blob(
    [JSON.stringify(state, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");

  link.href = url;
  link.download = "backup-biblioteca-estudos.json";
  link.click();

  URL.revokeObjectURL(url);
};

$("importInput").onchange = async e => {
  const arquivo = e.target.files?.[0];

  if (!arquivo) return;

  try {
    const dados = JSON.parse(await arquivo.text());

    if (
      !Array.isArray(dados.materials) ||
      !Array.isArray(dados.notes)
    ) {
      throw new Error();
    }

    state = dados;
    salvar();

    document.documentElement.dataset.theme =
      state.theme || "light";

    render();
  
    aviso("Backup importado.");
  } catch {
    alert("Este arquivo não é um backup válido.");
  }

  e.target.value = "";
};

function render() {
  estatisticas();
  categorias();
  navegacao();

  if (view === "anotacoes") {
    notas();
  } else {
    $("notesSection").classList.add("hidden");
    $("cardGrid").classList.remove("hidden");
    materiais();
  }
}

document.documentElement.dataset.theme =
  state.theme || "light";

render();
carregarNuvem();
