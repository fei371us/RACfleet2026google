<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/fae62b07-8fa1-4f8d-abbd-fcaa17aa8453

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to Azure App Service

This app runs as a Node.js web server (`server.ts`) and serves the built Vite frontend from `dist` in production.

### 1. Prerequisites

1. Install and sign in to Azure CLI:
   `az login`
2. Make sure your subscription is selected:
   `az account show`

### 2. Create Azure resources

Run these from the `RACfleet2026google` folder and replace names as needed:

```bash
RESOURCE_GROUP="rac-fleet-rg"
LOCATION="eastus"
PLAN_NAME="rac-fleet-plan"
WEBAPP_NAME="rac-fleet-<unique-name>"

az group create --name $RESOURCE_GROUP --location $LOCATION
az appservice plan create --name $PLAN_NAME --resource-group $RESOURCE_GROUP --sku B1 --is-linux
az webapp create --resource-group $RESOURCE_GROUP --plan $PLAN_NAME --name $WEBAPP_NAME --runtime "NODE:20-lts"
```

### 3. Set required app settings

```bash
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $WEBAPP_NAME \
  --settings GEMINI_API_KEY="<your-key>" NODE_ENV="production"
```

### 4. Deploy from local git

```bash
az webapp up \
  --name $WEBAPP_NAME \
  --resource-group $RESOURCE_GROUP \
  --runtime "NODE:20-lts"
```

Azure will run `npm install`, `npm run build`, then `npm start`.

Known working command (PowerShell):

```powershell
az webapp up --name $env:WEBAPP_NAME --resource-group $env:RESOURCE_GROUP --runtime "NODE:20-lts"
```

Important: run deployment from the app folder, not the repo root:
`cd c:\RACshuffer2026google\RACfleet2026google`

### 5. Open the deployed app

```bash
az webapp browse --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP
```

## 中文：部署与测试指南（PowerShell）

下面步骤适用于当前项目（Vite 前端 + `server.ts` Node 服务）。

### 一、部署到 Azure Web App

1. 进入项目目录：
   `cd c:\RACshuffer2026google\RACfleet2026google`

2. 登录并确认订阅：
   `az login`
   `az account show`

3. 设置变量（请替换 `WEBAPP_NAME` 为全局唯一）：
   `$RESOURCE_GROUP="rac-fleet-rg"`
   `$LOCATION="eastus"`
   `$PLAN_NAME="rac-fleet-plan"`
   `$WEBAPP_NAME="rac-fleet-<unique-name>"`

4. 创建资源：
   `az group create --name $RESOURCE_GROUP --location $LOCATION`
   `az appservice plan create --name $PLAN_NAME --resource-group $RESOURCE_GROUP --sku B1 --is-linux`
   `az webapp create --resource-group $RESOURCE_GROUP --plan $PLAN_NAME --name $WEBAPP_NAME --runtime "NODE|20-lts"`

5. 配置环境变量：
   `az webapp config appsettings set --resource-group $RESOURCE_GROUP --name $WEBAPP_NAME --settings GEMINI_API_KEY="<your-key>" NODE_ENV="production"`

6. 发布代码：
   `az webapp up --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP --runtime "NODE|20-lts"`

7. 打开站点：
   `az webapp browse --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP`

### 二、部署前测试（本地）

1. 安装依赖：
   `npm install`

2. 类型检查：
   `npm run lint`

3. 前端构建检查：
   `npm run build`

4. 启动服务（生产模式）：
   `$env:NODE_ENV="production"; npm start`

5. 新开一个终端做 API 冒烟测试：
   `Invoke-RestMethod http://localhost:3000/api/vehicles`
   `Invoke-RestMethod http://localhost:3000/api/jobs`

如果以上命令返回 JSON，说明核心接口可用。

### 三、部署后测试（Azure）

1. 访问首页，确认前端可加载。
2. 登录并检查主要页面（Admin / Dispatcher / Driver）。
3. 验证关键接口（把 `<app-name>` 替换为你的应用名）：
   `Invoke-RestMethod https://<app-name>.azurewebsites.net/api/vehicles`
   `Invoke-RestMethod https://<app-name>.azurewebsites.net/api/jobs`
4. 查看日志排查问题：
   `az webapp log tail --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP`
