import { blocoCodigo, estrutura, trecho } from './codigo.js'

const INSERIR = {
  id: 'inserir',
  titulo: 'Inserir',
  resumo:
    'Desce pela árvore comparando o valor com cada nó até achar um ponteiro NULL. Ali, criarNo() pede memória com malloc() e o novo nó é ligado ao pai.',
  pontos: [
    'Menor que o nó → vai para a <b>esquerda</b>; maior → vai para a <b>direita</b>.',
    'Ao chegar em <code>NULL</code>, encontramos o lugar do novo nó.',
    '<code>malloc(sizeof(No))</code> reserva espaço no <b>heap</b> em tempo de execução.',
    'A recursão devolve o ponteiro e o pai atualiza <code>esquerda</code>/<code>direita</code>.',
    'Valores repetidos são ignorados.',
  ],
  complexidade: 'O(h) - O(log n) se balanceada, O(n) no pior caso',
  trechos: [
    ['criarNo', 'Aloca um nó'],
    ['inserir', 'Inserção'],
  ],
}

const INSERIR_AVL = {
  id: 'inserir',
  titulo: 'Inserir',
  resumo:
    'Insere como na BST e, na volta da recursão, cada ancestral confere o seu fator de balanceamento. Se um lado ficar 2 níveis mais alto, rebalancear() aplica a rotação.',
  pontos: [
    'A descida é igual à da BST: compara e vai para a esquerda ou para a direita.',
    'O novo nó é criado com <code>malloc</code> em <code>criarNo()</code>.',
    'Na volta, cada ancestral passa por <code>rebalancear()</code>.',
    'Fator <b>+2</b> → rotação à direita; fator <b>-2</b> → rotação à esquerda.',
    'Filho pendendo para o lado oposto → <b>rotação dupla</b> (LR ou RL).',
    'Aqui a altura é recalculada para manter a <code>struct No</code> simples; implementações reais guardam a altura no nó.',
  ],
  complexidade: 'O(log n) com a altura guardada no nó',
  trechos: [
    ['inserirAVL', 'Inserção'],
    ['rebalancear', 'Rebalanceamento'],
  ],
}

const BUSCAR = {
  id: 'buscar',
  titulo: 'Buscar',
  resumo:
    'Aproveita a regra da BST: a cada comparação descarta um dos lados da árvore. Retorna o ponteiro para o nó ou NULL se não existir.',
  pontos: [
    'Caso base: nó <code>NULL</code> (não achou) ou valor igual (achou).',
    'Valor menor → busca só na subárvore <b>esquerda</b>.',
    'Valor maior → busca só na subárvore <b>direita</b>.',
    'Não aloca nem libera memória: apenas segue ponteiros.',
  ],
  complexidade: 'O(h) - O(log n) se balanceada, O(n) no pior caso',
  trechos: [['buscar', 'Busca']],
}

const REMOVER = {
  id: 'remover',
  titulo: 'Remover',
  resumo:
    'Localiza o nó e trata três casos. Nos casos simples o nó é desligado e liberado com free(). Com dois filhos, ele recebe o valor do sucessor e o sucessor é removido.',
  pontos: [
    '<b>Caso 1 - folha:</b> basta <code>free()</code> e devolver <code>NULL</code> ao pai.',
    '<b>Caso 2 - um filho:</b> o filho "sobe" e ocupa o lugar do nó liberado.',
    '<b>Caso 3 - dois filhos:</b> copia o <b>sucessor</b> (menor da direita) e remove-o.',
    'Sem o <code>free()</code> a memória ficaria perdida (<i>memory leak</i>).',
  ],
  complexidade: 'O(h)',
  trechos: [
    ['menorNo', 'Encontra o sucessor'],
    ['remover', 'Remoção'],
  ],
}

const REMOVER_AVL = {
  id: 'remover',
  titulo: 'Remover',
  resumo:
    'Remove como na BST (folha, um filho ou dois filhos com sucessor) e, na volta da recursão, rebalanceia cada ancestral.',
  pontos: [
    '<b>Folha ou um filho:</b> o filho ocupa o lugar e o nó recebe <code>free()</code>.',
    '<b>Dois filhos:</b> copia o <b>sucessor</b> e remove-o da subárvore direita.',
    'Diferente da inserção, uma remoção pode exigir rotações em <b>vários níveis</b>.',
    '<code>rebalancear()</code> é a mesma função usada na inserção.',
  ],
  complexidade: 'O(log n) com a altura guardada no nó',
  trechos: [
    ['removerAVL', 'Remoção'],
    ['menorNo', 'Encontra o sucessor'],
  ],
}

const PERCORRER = {
  id: 'percorrer',
  titulo: 'Percorrer',
  resumo:
    'Visita todos os nós usando recursão. A única diferença entre os três percursos é o MOMENTO em que a raiz é visitada.',
  pontos: [
    '<b>Pré-ordem:</b> raiz → esquerda → direita (copiar a árvore).',
    '<b>Em-ordem:</b> esquerda → raiz → direita (sai <b>ordenado</b>).',
    '<b>Pós-ordem:</b> esquerda → direita → raiz (usado para liberar).',
    'O vetor de saída é alocado com <code>malloc</code> no tamanho exato da árvore.',
  ],
  complexidade: 'O(n) - cada nó é visitado uma vez',
  trechos: [['percorrer', 'Percursos']],
}

const LARGURA = {
  id: 'largura',
  titulo: 'Percurso em largura',
  resumo:
    'Visita a árvore nível por nível, de cima para baixo. Para isso usa uma segunda estrutura dinâmica: uma FILA implementada como lista encadeada.',
  pontos: [
    'Começa enfileirando a <b>raiz</b>.',
    'Enquanto a fila não estiver vazia: <b>desenfileira</b>, visita e enfileira os filhos.',
    'Cada item da fila nasce com <code>malloc</code> e morre com <code>free</code> ao sair.',
    'Primeiro a entrar é o primeiro a sair (<b>FIFO</b>) → garante a ordem por nível.',
  ],
  complexidade: 'O(n) - cada nó entra e sai da fila uma vez',
  trechos: [
    ['fila', 'Fila dinâmica (lista encadeada)'],
    ['largura', 'Percurso em largura'],
  ],
}

const ESTATISTICAS = {
  id: 'estatisticas',
  titulo: 'Altura, mínimo e máximo',
  resumo:
    'Três consultas que usam a forma da árvore. O menor valor está sempre no fim do caminho à esquerda; o maior, no fim do caminho à direita.',
  pontos: [
    '<b>Altura:</b> 1 + a maior altura entre os dois filhos (árvore vazia = 0).',
    '<b>Mínimo:</b> desce sempre para a <b>esquerda</b> até achar <code>NULL</code>.',
    '<b>Máximo:</b> desce sempre para a <b>direita</b> até achar <code>NULL</code>.',
    'A altura define o custo de inserir, buscar e remover: O(h).',
  ],
  complexidade: 'Altura O(n) · Mínimo/Máximo O(h)',
  trechos: [
    ['altura', 'Altura'],
    ['menorNo', 'Mínimo'],
    ['maiorNo', 'Máximo'],
  ],
}

const ESPELHAR = {
  id: 'espelhar',
  titulo: 'Espelhar',
  resumo:
    'Inverte a árvore como num espelho: em cada nó, os ponteiros esquerda e direita trocam de lugar. Nada é alocado nem liberado, só ponteiros mudam.',
  pontos: [
    'Troca <code>esquerda</code> e <code>direita</code> usando uma variável <code>temp</code>.',
    'Repete recursivamente nos dois filhos.',
    'Depois de espelhada, os <b>maiores</b> ficam à esquerda: ela <b>deixa de ser BST</b>.',
    'Por isso inserir/buscar/remover ficam bloqueados até espelhar de novo.',
    'Espelhar duas vezes devolve a árvore original.',
  ],
  complexidade: 'O(n) - visita cada nó uma vez',
  trechos: [['espelhar', 'Espelhamento']],
}

const LIBERAR = {
  id: 'liberar',
  titulo: 'Liberar',
  resumo:
    'Devolve ao sistema toda a memória alocada. Usa pós-ordem: libera os filhos antes do pai, senão perderíamos os ponteiros para eles.',
  pontos: [
    'Primeiro libera a subárvore esquerda, depois a direita.',
    'Só então chama <code>free()</code> no próprio nó.',
    'Se liberasse o pai antes, os filhos ficariam inacessíveis → <i>memory leak</i>.',
    'Retorna quantos nós foram liberados; depois a raiz volta a ser <code>NULL</code>.',
  ],
  complexidade: 'O(n)',
  trechos: [['liberar', 'Liberação']],
}

const INTRO_BST = {
  id: 'estrutura',
  titulo: 'Árvore Binária de Busca',
  resumo:
    'Cada nó guarda um valor e dois ponteiros. Os nós não ficam em um vetor: são criados um a um no heap com malloc() e ligados por ponteiros.',
  pontos: [
    '<code>esquerda</code> aponta para valores <b>menores</b>.',
    '<code>direita</code> aponta para valores <b>maiores</b>.',
    'Um ponteiro <code>NULL</code> indica que não há filho.',
    'A árvore cresce e diminui em tempo de execução: isso é alocação dinâmica.',
  ],
  complexidade: 'sizeof(No) = 1 int + 2 ponteiros',
  codigoExtra: estrutura,
}

const INTRO_AVL = {
  id: 'estrutura',
  titulo: 'Árvore AVL',
  resumo:
    'Uma BST que se mantém balanceada sozinha: em todo nó, a altura das duas subárvores difere no máximo em 1. Assim ela nunca vira uma "lista".',
  pontos: [
    '<b>Fator de balanceamento</b> = altura(esquerda) - altura(direita).',
    'O número embaixo de cada nó na tela é o fator dele.',
    'Quando um nó chega a <b>+2</b> ou <b>-2</b>, uma rotação corrige.',
    'Rotações só trocam ponteiros: nenhum <code>malloc</code>/<code>free</code>, e a ordem da BST é mantida.',
    'Usa a mesma <code>struct No</code> da BST.',
  ],
  complexidade: 'Altura sempre O(log n)',
  trechos: [['rotacoes', 'Fator e rotações']],
}

export const TIPOS = {
  bst: {
    nome: 'Árvore Binária de Busca',
    intro: INTRO_BST,
    operacoes: [INSERIR, BUSCAR, REMOVER, PERCORRER, LARGURA, ESTATISTICAS, ESPELHAR, LIBERAR],
  },
  avl: {
    nome: 'Árvore AVL',
    intro: INTRO_AVL,
    operacoes: [INSERIR_AVL, BUSCAR, REMOVER_AVL, PERCORRER, LARGURA, ESTATISTICAS, LIBERAR],
  },
}

let tipo = 'bst'
let slides = []

export function definirTipoSlides(novo) {
  tipo = novo
  const { intro, operacoes } = TIPOS[tipo]
  slides = [intro, ...operacoes.map((op, i) => ({ ...op, numero: i + 1 }))]
}

export function operacoes() {
  return slides.slice(1)
}

const modal = document.getElementById('modal')
const slideEl = document.getElementById('slide')
let atual = 0
let aoExecutar = () => {}

function renderizar() {
  const s = slides[atual]
  const codigos = s.codigoExtra
    ? `<figure><figcaption>arvore.h</figcaption>${blocoCodigo(s.codigoExtra())}</figure>`
    : s.trechos
        .map(([nome, legenda]) => {
          const { arquivo, codigo } = trecho(nome)
          return `<figure><figcaption>${legenda} · ${arquivo}</figcaption>${blocoCodigo(codigo)}</figure>`
        })
        .join('')

  slideEl.innerHTML = `
    <header class="slide-topo">
      <div>
        <span class="slide-tag">${s.numero ? `${TIPOS[tipo].nome} · Operação ${s.numero} de ${slides.length - 1}` : 'Introdução'}</span>
        <h2>${s.numero ? `<span class="slide-num">${s.numero}</span>` : ''}${s.titulo}</h2>
      </div>
      <button class="btn-icone" data-acao="fechar" title="Esc">Fechar</button>
    </header>
    <div class="slide-corpo">
      <div class="slide-texto">
        <p class="slide-resumo">${s.resumo}</p>
        <ul>${s.pontos.map((p) => `<li>${p}</li>`).join('')}</ul>
        <div class="slide-complex"><small>Complexidade</small>${s.complexidade}</div>
      </div>
      <div class="slide-codigo">${codigos}</div>
    </div>
    <footer class="slide-rodape">
      <button class="btn-fantasma" data-acao="anterior" ${atual === 0 ? 'disabled' : ''}>← Anterior</button>
      <div class="pontos">${slides.map((_, i) => `<i class="${i === atual ? 'on' : ''}" data-ir="${i}"></i>`).join('')}</div>
      ${s.numero ? `<button class="btn-primario" data-acao="executar">Executar ${s.titulo.toLowerCase()}</button>` : ''}
      <button class="btn-fantasma" data-acao="proximo" ${atual === slides.length - 1 ? 'disabled' : ''}>Próximo →</button>
    </footer>`
}

export function abrirSlide(id) {
  atual = Math.max(0, slides.findIndex((s) => s.id === id))
  renderizar()
  modal.hidden = false
}

export function fecharSlide() {
  modal.hidden = true
}

export function configurarSlides(executar) {
  aoExecutar = executar
  modal.addEventListener('click', (e) => {
    if (e.target === modal) return fecharSlide()
    const ir = e.target.closest('[data-ir]')
    if (ir) {
      atual = Number(ir.dataset.ir)
      return renderizar()
    }
    const acao = e.target.closest('[data-acao]')?.dataset.acao
    if (acao === 'fechar') fecharSlide()
    if (acao === 'anterior' && atual > 0) { atual--; renderizar() }
    if (acao === 'proximo' && atual < slides.length - 1) { atual++; renderizar() }
    if (acao === 'executar') {
      fecharSlide()
      aoExecutar(slides[atual].id)
    }
  })
  document.addEventListener('keydown', (e) => {
    if (modal.hidden) return
    if (e.key === 'Escape') fecharSlide()
    if (e.key === 'ArrowRight' && atual < slides.length - 1) { atual++; renderizar() }
    if (e.key === 'ArrowLeft' && atual > 0) { atual--; renderizar() }
  })
}

definirTipoSlides('bst')
