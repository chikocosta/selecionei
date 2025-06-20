# Selecionei

Selecionei é uma plataforma que analisa currículos de forma inteligente para auxiliar equipes de RH na triagem de candidatos.

## Executar o projeto

### Backend (Flask)
1. Instale as dependências listadas em `selecionei-backend/requirements.txt`.
2. Defina a variável de ambiente `SECRET_KEY` (veja `.env.example`).
3. Inicie a aplicação com:
   ```bash
   python selecionei-backend/src/main.py
   ```

### Frontend (React + Vite)
1. Dentro de `selecionei-frontend`, instale as dependências com o gerenciador de pacotes de sua preferência (ex.: `pnpm install`).
2. Rode a aplicação de desenvolvimento:
   ```bash
   pnpm dev
   ```

O frontend será executado em `http://localhost:5173` e espera o backend em `http://localhost:5001`.

## Contato
Envie dúvidas para [contato@selecionei.com.br](mailto:contato@selecionei.com.br).
