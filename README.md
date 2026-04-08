# Meta Ads Dashboard

Dashboard interno para acompanhamento de campanhas Meta Ads.

## Estrutura

```
meta-dashboard/
├── api/
│   └── meta.js         ← Backend serverless (roda na Vercel)
├── public/
│   └── index.html      ← Dashboard HTML
├── vercel.json         ← Configuração da Vercel
└── package.json
```

## Deploy na Vercel (passo a passo)

### 1. Criar repositório no GitHub

1. Acesse github.com → New repository
2. Nome: `meta-ads-dashboard` (ou qualquer outro)
3. Deixe privado (Private) — recomendado
4. Clique em "Create repository"

### 2. Subir os arquivos

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/SEU_USUARIO/meta-ads-dashboard.git
git push -u origin main
```

### 3. Conectar na Vercel

1. Acesse vercel.com e faça login
2. Clique em "Add New Project"
3. Importe o repositório do GitHub
4. Clique em "Deploy" (sem alterar nada ainda)

### 4. Configurar variáveis de ambiente

Após o deploy, vá em:
**Settings → Environment Variables**

Adicione:

| Nome | Valor |
|------|-------|
| `META_ACCESS_TOKEN` | Seu System User Token |
| `META_AD_ACCOUNT_ID` | `act_XXXXXXXXX` (com o `act_` na frente) |

Depois clique em **Redeploy** para aplicar as variáveis.

### 5. Acessar o dashboard

O link público ficará no formato:
`https://meta-ads-dashboard-XXXXX.vercel.app`

Compartilhe esse link com qualquer pessoa do time.

---

## Atualização automática

O dashboard atualiza os dados automaticamente a cada **30 minutos**.
A Vercel também faz cache de 30 minutos nas respostas da API para reduzir chamadas à Meta.

## Funcionalidades

- 📊 KPIs agregados: Gasto, Impressões, Cliques, CTR, CPC, Alcance, Resultados
- 📋 Tabela de campanhas com ordenação por qualquer coluna
- 🔍 Drill-down: Campanha → Conjunto de Anúncios → Anúncios
- 🖼️ Grid de criativos com thumbnail + ranking por CTR
- 📈 Gráfico de barras de gasto por campanha/conjunto
- 🗓️ Filtros de período: 7, 14, 30, 60 e 90 dias
- ♻️ Atualização automática a cada 30 min
