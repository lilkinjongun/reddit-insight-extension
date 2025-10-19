# Reddit Insight Extension

Esta extensão para navegadores baseados em Chromium analisa threads do Reddit para fornecer insights resumidos, análise de sentimento, identificação de comentários relevantes, detecção de polarização, exportação de dados e um modo de leitura limpa. Também inclui integração com IA para gerar respostas automáticas.

## Funcionalidades

-   **Análise de Comentários:** Analisa automaticamente todos os comentários de uma thread/discussão do Reddit, com pré-processamento para limpeza de texto.
-   **Insights Resumidos:** Gera um resumo inteligente dos principais tópicos abordados, utilizando um Web Worker para melhor performance.
-   **Comentários Relevantes:** Identifica os comentários mais relevantes com base em engajamento, repetição de temas e polarização.
-   **Análise de Sentimento:** Filtra comentários por sentimento (positivo, negativo, neutro), com processamento em lotes.
-   **Detecção de Polarização:** Identifica a polarização ou controvérsia na discussão.
-   **Exportação de Insights:** Permite exportar os insights em formato Markdown aprimorado para futura conversão em PDF.
-   **Modo Leitura Limpa:** Remove ruído visual da página do Reddit para destacar o conteúdo relevante. (Nota: Seletores de elementos não-essenciais foram simplificados para maior robustez).
-   **Integração com IA:** Gera respostas ou comentários automáticos com base nos insights (requer chave da API OpenAI).
-   **Feedback de Progresso:** Exibe mensagens de progresso durante a análise para uma melhor experiência do usuário.
-   **Página de Configurações:** Gerencie sua chave da API OpenAI e outras configurações em uma página de opções dedicada.
-   **Tratamento de Erros Aprimorado:** Melhor tratamento de erros para a API do Reddit e da OpenAI, fornecendo mensagens mais informativas.

## Melhorias de Performance e UI/UX

-   **Web Workers:** A lógica de análise de sentimento e sumarização foi migrada para um Web Worker, evitando o bloqueio da UI e melhorando a responsividade da extensão.
-   **Pré-carregamento de Modelos:** Modelos de IA são pré-carregados e armazenados em cache no service worker para reduzir o tempo de inicialização da análise.
-   **Interface Mais Intuitiva:** O popup da extensão foi redesenhado para ser mais limpo e intuitivo, com seções recolhíveis para os resultados e botões de ação claros.

## Como Instalar e Usar (Modo Desenvolvedor)

1.  **Baixe a Extensão:**
    -   Baixe o arquivo `reddit-insight-extension-fixed.zip` fornecido. (Ou clone o repositório do GitHub: `git clone https://github.com/lilkinjongun/reddit-insight-extension.git`)
    -   Descompacte o arquivo em uma pasta de sua preferência (ex: `C:\Users\SeuUsuario\Desktop\reddit-insight-extension`). Certifique-se de que o `manifest.json` esteja diretamente dentro da pasta descompactada.

2.  **Carregue a Extensão no Chrome/Brave:**
    a.  Abra o navegador (Chrome ou Brave).
    b.  Digite `chrome://extensions` (para Chrome) ou `brave://extensions` (para Brave) na barra de endereço e pressione Enter.
    c.  Ative o **Modo Desenvolvedor** (geralmente um toggle no canto superior direito da página).
    d.  Clique em **Carregar sem compactação** (Load unpacked).
    e.  Navegue até o diretório `reddit-insight-extension` que você descompactou e selecione-o.
    f.  A extensão "Reddit Insight Extension" deve aparecer na sua lista de extensões.

3.  **Configurar a Chave da API OpenAI (Opcional):**
    a.  Clique com o botão direito do mouse no ícone da extensão na barra de ferramentas do navegador.
    b.  Selecione **"Opções"** (ou "Options").
    c.  Na página de configurações, insira sua chave da API OpenAI no campo designado e clique em "Salvar API Key". Isso é necessário apenas se você quiser usar a funcionalidade de "Gerar Resposta AI".

4.  **Usar a Extensão:**
    a.  Navegue para uma thread de comentários do Reddit (ex: `https://www.reddit.com/r/AskReddit/comments/example_thread/`).
    b.  Clique no ícone da extensão na barra de ferramentas.
    c.  Clique no botão "Analyze Comments" para iniciar a análise.
    d.  Os resultados (resumo, polarização, comentários relevantes e todos os comentários) serão exibidos no popup.
    e.  Use os filtros de sentimento e os botões de exportação conforme necessário.
    f.  Para o Modo Leitura Limpa, clique no botão correspondente no popup. Clique novamente para desativar.

## Estrutura do Projeto

```
reddit-insight-extension/
├── manifest.json
├── popup.html
├── popup.js
├── content.js
├── background.js
├── analysis-worker.js
├── options.html
├── options.js
├── lib/
│   └── transformers.min.js
└── images/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
└── docs/
    ├── README.md
    └── DIAGNOSTICO_E_MELHORIAS.md
    └── reddit_api_info.md
```

## Desenvolvimento

Para desenvolvedores, o projeto está configurado para fácil manutenção e expansão. As principais lógicas estão divididas entre:
-   `background.js`: Service Worker principal, lida com a comunicação entre partes da extensão, fetching da API do Reddit e orquestração da análise.
-   `content.js`: Injeta scripts na página do Reddit para interagir com o DOM (ex: Modo Leitura Limpa).
-   `popup.html`/`popup.js`: Interface do usuário da extensão e lógica para exibir resultados e interagir com o Service Worker.
-   `analysis-worker.js`: Web Worker dedicado para executar tarefas pesadas de IA (análise de sentimento, sumarização) sem bloquear a thread principal da extensão.
-   `options.html`/`options.js`: Página de configurações para gerenciar a chave da API OpenAI e futuras opções.

## Contribuição

Sinta-se à vontade para contribuir com melhorias, correções de bugs ou novas funcionalidades. Por favor, abra uma issue ou envie um pull request no repositório GitHub.
