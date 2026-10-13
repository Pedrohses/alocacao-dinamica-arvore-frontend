# Árvores BST e AVL em C - Frontend

Interface que **desenha ao vivo** uma Árvore Binária de Busca e uma Árvore AVL
implementadas em C, animando cada operação passo a passo. Cada operação tem um
**slide** com a explicação e o código C real, lido do próprio servidor.

Projeto desenvolvido na disciplina de **Paradigmas de Linguagens de Programação**.
O servidor em C fica em
[alocacao-dinamica-arvore-backend](https://github.com/Pedrohses/alocacao-dinamica-arvore-backend).

Feito com [Vite](https://vite.dev), JavaScript puro e SVG, sem frameworks.

## Funcionalidades

- Seleção entre **Binária de Busca** e **AVL**, cada uma com a sua árvore e só as operações que fazem sentido para ela.
- Inserir, buscar, remover, percorrer (pré, em e pós-ordem), percurso em largura, altura/mínimo/máximo, espelhar (só BST) e liberar.
- Animação da descida pela árvore, com a área **Saída** narrando cada comparação (`35 < 50 → vai para a esquerda`).
- Na AVL, o fator de balanceamento aparece embaixo de cada nó, e a árvore desbalanceada é mostrada antes da rotação.
- **Inserir 10 a 80 em ordem** para comparar: a BST vira uma "lista", a AVL continua equilibrada.
- Slides com explicação, complexidade e código, com as linhas de `malloc`/`free` destacadas.
- Controle de velocidade das animações (0.5× a 4×).

## Como rodar

Com o [backend](https://github.com/Pedrohses/alocacao-dinamica-arvore-backend) rodando:

```bash
npm install
npm run dev
```

Abra http://localhost:5173. O indicador no canto superior direito fica verde quando
o servidor em C está conectado.

### Configuração

| Variável | Padrão | Uso |
|----------|--------|-----|
| `VITE_API_URL` | `http://127.0.0.1:8080` | URL do servidor em C, sem barra no final. |

Copie `.env.example` para `.env` para mudar localmente. Em desenvolvimento o Vite
repassa `/api` para essa URL; no build ela é chamada diretamente.

> Variáveis `VITE_` são lidas durante o build: se a URL mudar, gere o build de novo.

## Deploy na Vercel

1. Importe este repositório (o Vite é detectado automaticamente).
2. Em *Environment Variables*, defina `VITE_API_URL` com a URL do backend, por exemplo
   `https://seu-backend.onrender.com`.
3. Faça o deploy.

## Atalhos nos slides

| Tecla | Ação |
|-------|------|
| ← / → | slide anterior / próximo |
| Esc | fechar |

## Licença

[MIT](LICENSE)
