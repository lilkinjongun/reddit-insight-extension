# Reddit Insight Extension

Esta extensão para navegadores baseados em Chromium analisa threads do Reddit para fornecer insights resumidos, análise de sentimento, identificação de comentários relevantes, detecção de polarização, exportação de dados e um modo de leitura limpa. Também inclui integração com IA para gerar respostas automáticas.

## Funcionalidades

- **Análise de Comentários:** Analisa automaticamente todos os comentários de uma thread/discussão do Reddit.
- **Insights Resumidos:** Gera um resumo inteligente dos principais tópicos abordados.
- **Comentários Relevantes:** Identifica os comentários mais relevantes com base em engajamento, repetição de temas e polarização.
- **Análise de Sentimento:** Filtra comentários por sentimento (positivo, negativo, neutro).
- **Detecção de Polarização:** Identifica a polarização ou controvérsia na discussão.
- **Exportação de Insights:** Permite exportar os insights em formato Markdown (PDF em desenvolvimento).
- **Modo Leitura Limpa:** Remove ruído visual da página do Reddit para destacar o conteúdo relevante.
- **Integração com IA:** Gera respostas ou comentários automáticos com base nos insights (requer chave da API OpenAI).

## Como Instalar e Usar (Modo Desenvolvedor)

1.  **Baixe a Extensão:**
    - Crie um diretório para a extensão, por exemplo, `reddit-insight-extension`.
    - Salve todos os arquivos fornecidos (`manifest.json`, `popup.html`, `popup.js`, `content.js`, `background.js`, `reddit_api_info.md`, e o diretório `lib` com `transformers.min.js`, e o diretório `images` com os ícones) dentro deste diretório.

2.  **Carregue a Extensão no Chrome/Edge:**
    a. Abra o navegador Chrome ou Edge.
    b. Digite `chrome://extensions` (para Chrome) ou `edge://extensions` (para Edge) na barra de endereço e pressione Enter.
    c. Ative o **Modo Desenvolvedor** (geralmente um toggle no canto superior direito da página).
    d. Clique em **Carregar sem compactação** (Load unpacked).
    e. Navegue até o diretório `reddit-insight-extension` que você criou e selecione-o.
    f. A extensão 

válida.
