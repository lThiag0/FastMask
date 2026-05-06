# ⚡ FastMask Turbo - Produtividade em Atendimentos

**FastMask Turbo** é uma extensão para Google Chrome desenvolvida para otimizar o fluxo de trabalho de equipes de suporte e atendimento ao cliente. Ela permite a criação, gestão e inserção instantânea de atalhos de texto (templates) em qualquer campo de entrada na web, utilizando gatilhos personalizáveis.

---

## 🚀 Funcionalidades Principais

- **Atalhos Instantâneos:** Substituição de gatilhos (ex: `//oi`) por textos complexos e formatados.
- **Menu Flutuante Inteligente:** Interface intuitiva que aparece no cursor para seleção de atalhos.
- **Gestão por Categorias:** Organize seus atalhos em pastas (ex: Suporte, Seguros, Tickets).
- **Busca Global:** Pesquisa rápida por títulos de atalhos diretamente no campo de texto.
- **Interface Moderna:** Popup e Gerenciador com design focado em UX (User Experience).
- **Sistema de Toasts:** Notificações não intrusivas para confirmação de ações.

## 🛡️ Privacidade e Segurança (Compliance)

Este projeto foi desenhado com foco total na privacidade dos dados e segurança da informação corporativa:

- **Armazenamento Local:** Todos os atalhos e configurações são armazenados exclusivamente no `chrome.storage.local` do navegador do usuário.
- **Sem Coleta de Dados de Terceiros:** A extensão **não armazena, não transmite e não coleta** nenhuma informação digitada pelo usuário ou dados de terceiros presentes nos sites visitados.
- **Execução Offline:** A lógica de substituição ocorre localmente, sem necessidade de chamadas para APIs externas que possam comprometer a segurança dos dados.
- **Transparência:** O código é estruturado de forma a garantir que apenas as funções de automação de texto sejam executadas.

## 🛠️ Tecnologias Utilizadas

- **JavaScript (Vanilla):** Lógica central e manipulação de DOM.
- **HTML5 & CSS3:** Interface estruturada com variáveis CSS para temas.
- **Chrome Extension API:** Integração profunda com o navegador (Storage, Scripting).

## 📋 Como Instalar (Modo Desenvolvedor)

1. Faça o download ou clone este repositório.
2. Abra o Google Chrome e acesse `chrome://extensions/`.
3. Ative o **Modo do desenvolvedor** no canto superior direito.
4. Clique em **Carregar sem compactação** e selecione a pasta do projeto.

---

**Desenvolvido por:** [Thiago Araujo](https://github.com/lThiag0)  
*Transformando processos manuais em automação eficiente.*
