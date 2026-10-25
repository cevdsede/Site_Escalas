# Site do Ministério de Louvor (CEVD)

Site estático e instalável (PWA) do ministério de louvor da Comunidade Evangélica Valentes de Davi. Reúne a **escala dos cultos**, o **repertório de cada culto**, a **biblioteca de músicas** e a lista do **Passos de Fé**. Funciona no celular e no computador, em tema claro e escuro, e abre sem internet com a última leitura salva.

Não tem etapa de build: são arquivos HTML, CSS e JavaScript puros.

## Páginas

| Página | Arquivo | O que faz |
| :-- | :-- | :-- |
| Início | `index.html` | Botões para a Escala, a Biblioteca e a lista do Passos de Fé (janela em tela cheia), mais o botão **Instalar app**. |
| Escala | `escala/index.html` | Próximos cultos com a equipe (ministro, backs e instrumentos), filtro por pessoa, "Próximo culto", agendar no calendário, compartilhar e o **repertório de cada culto** (adicionar e excluir músicas). |
| Músicas | `musicas/biblioteca-musicas.html` | Biblioteca com busca, filtros por tema e estilo, ordenação por "mais tocadas", links de letra, cifra, Spotify e YouTube, e cadastro de música nova. |
| Repertório | `musicas/repertorio.html` | Repertórios por culto e histórico das músicas cantadas, recolhido por ministro. |

## De onde vêm os dados

| Dado | Fonte |
| :-- | :-- |
| Equipe completa do culto (ministro, backs, teclado, guitarra, baixo, bateria, violão) e ensaio | **Planilha do Google** publicada na web em CSV (`CSV_URL` em `escala/index.html`) |
| Cultos, ministros e vocais escalados, músicas, tons, repertórios e histórico | **Supabase**, função `repertorio-publico` |
| Biblioteca de músicas e cadastro de música nova | **Supabase**, função `biblioteca-musicas` |
| Lista do Passos de Fé (ordem e links) | `passos-de-fe.json`, com nome e cantor conferidos na Biblioteca |

Na **Escala**, a planilha e o Supabase são juntados pela data e pelo horário do culto. Se o culto existe nos dois, vale a equipe da planilha. Se só existe no Supabase, aparece com os ministros e vocais escalados. As duas fontes são relidas a cada minuto.

Adicionar ou excluir música do repertório exige o **PIN** do ministério. A conferência do PIN e o limite de tentativas ficam nas funções do Supabase, não neste site. **Nenhuma chave ou PIN está neste repositório.**

## Funcionamento offline e atualizações

- `sw.js` (service worker) guarda as páginas. Com internet, busca sempre a versão mais nova; sem internet, usa o que está salvo.
- A escala, a lista de músicas e o repertório ficam salvos no aparelho (`localStorage`) e aparecem na hora, mesmo sem conexão.
- Quando há versão nova do site, aparece o aviso **"Há uma versão nova do site. Atualizar"**.
- `manifest.webmanifest` define o app instalável, o ícone e os atalhos (Escala, Músicas, Repertório, Início).

## Estrutura

```
index.html                  página inicial (e janela do Passos de Fé)
escala/index.html           escala dos cultos e repertório
musicas/
  biblioteca-musicas.html   biblioteca de músicas
  repertorio.html           repertórios e histórico
passos-de-fe.json           lista curada do Passos de Fé
theme.css  theme.js         tema claro/escuro compartilhado
site.js                     instalar app, service worker, aviso de versão, diálogo de excluir
sw.js                       service worker (cache e uso offline)
manifest.webmanifest        configuração do app instalável
icons/                      ícones do app
logo louvor.png             logo usado nas páginas
```

## Rodar no computador

Qualquer servidor estático serve. Com Python instalado:

```bash
python -m http.server 8766
```

Abra `http://localhost:8766`. O service worker só funciona em `localhost` ou em HTTPS.

## Publicar uma nova versão

1. Altere os arquivos.
2. **Troque o número de `CACHE` em `sw.js`** (por exemplo, `escala-v11` para `escala-v12`). É isso que faz o aviso de versão nova aparecer nos aparelhos.
3. Faça o commit e o push para a branch `main`. O GitHub Pages publica sozinho em cerca de 1 minuto.

## Tarefas comuns

- **Mudar a lista do Passos de Fé:** edite `passos-de-fe.json` (nome, cantor e, se quiser, links diretos de `letra`, `cifra` e `spotify`).
- **Cadastrar música no Passos de Fé:** cadastre na Biblioteca com o tema "Passos de Fé"; a lista confere o nome e o cantor por lá.
- **Trocar a planilha da escala:** publique a aba em CSV (Arquivo > Compartilhar > Publicar na web) e atualize `CSV_URL` em `escala/index.html`. A planilha pode ter uma coluna opcional **Repertório** (músicas separadas por `;`), usada só quando o culto ainda não tem repertório no Supabase.

## Visual

Tokens de cor, fontes e componentes compartilhados ficam em `theme.css`. A janela do Passos de Fé usa o visual do app Valentes Connected (creme, azul-marinho e dourado, fonte Plus Jakarta Sans).
