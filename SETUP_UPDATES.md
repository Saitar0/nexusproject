## 🔐 Guia de Configuração de Updates Assinados

### Passo 1: Gerar Chaves de Assinatura

```bash
# Instale a CLI do Tauri (se não tiver)
npm install -g @tauri-apps/cli

# Na raiz do projeto, gere as chaves:
npx tauri signer generate -w UPDATE_KEY.txt
```

**Importante:**
- Isso criará dois arquivos:
  - `UPDATE_KEY.txt` (CHAVE PRIVADA) - **GUARDAR COM SEGURANÇA**
  - Será exibida a chave pública no console

### Passo 2: Guardar a Chave Privada com Segurança

**NUNCA comitar a chave privada no Git!**

Opções recomendadas:

#### Opção A: Arquivo local (mais seguro para desenvolvimento)
```bash
# Copie o arquivo UPDATE_KEY.txt para um lugar seguro
# Exemplo:
mkdir -p ~/.tauri-keys/minhaloja
cp UPDATE_KEY.txt ~/.tauri-keys/minhaloja/

# Adicione ao .gitignore (já feito):
*.priv.key
update.key
UPDATE_KEY.txt
```

#### Opção B: Variável de ambiente (para CI/CD)
```bash
# Salve em arquivo .env (não comitar):
TAURI_SIGNING_PRIVATE_KEY="your-private-key-content-here"
TAURI_SIGNING_PRIVATE_KEY_PASSWORD="optional-password"

# No seu script de build:
export TAURI_SIGNING_PRIVATE_KEY=$(cat ~/.tauri-keys/minhaloja/UPDATE_KEY.txt)
npm run tauri build
```

#### Opção C: GitHub Secrets (para publicação automática)
1. Crie um secret no seu repo: `Settings` → `Secrets` → `TAURI_SIGNING_KEY`
2. Cole o conteúdo do `UPDATE_KEY.txt`
3. Use em `.github/workflows/build.yml`

### Passo 3: Configurar Chave Pública no tauri.conf.json

```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": ["http://seu-servidor/api/updates/latest.json"],
      "dialog": true,
      "pubkey": "dW5kZXJzdG9vZCBkYXRhOiBpbiBvcmRlciB0byBhbHdheXMgYXJyaXZl"
    }
  }
}
```

**Obtendo a chave pública:**
```bash
# Após rodar o comando de gerar chaves:
npx tauri signer generate -w UPDATE_KEY.txt

# Será exibida algo como:
# Public key: dU3l5k7f2j3k...
```

### Passo 4: Assinar Updates na Build

```bash
# Build do projeto (assina automaticamente)
npm run tauri build

# Será gerado um arquivo .sig
# Exemplo: 
# src-tauri/target/release/bundle/msi/MinhaLoja_0.2.0_x64_en-US.msi.sig
```

### Passo 5: Servir o Update JSON com Assinatura

1. Faça upload do arquivo `.msi` / `.AppImage` para seu servidor
2. Crie o JSON de updates com a assinatura:

```json
{
  "version": "0.2.0",
  "notes": "changelog aqui",
  "pub_date": "2026-07-15T10:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "conteudo do arquivo .sig",
      "url": "http://seu-servidor/updates/MinhaLoja_0.2.0_x64_en-US.msi"
    }
  }
}
```

### Passo 6: Endpoint de Update

O endpoint deve retornar o JSON acima.

**Exemplo com Flask:**
```python
@app.route('/api/updates/latest.json')
def get_update():
    return jsonify({
        'version': '0.2.0',
        'notes': 'Changelog...',
        'pub_date': '2026-07-15T10:00:00Z',
        'platforms': {
            'windows-x86_64': {
                'signature': 'conteúdo-do-.sig',
                'url': 'http://seu-servidor/updates/MinhaLoja_0.2.0_x64_en-US.msi'
            }
        }
    })
```

### ⚠️ Segurança - Checklist

- ✅ UPDATE_KEY.txt está em .gitignore
- ✅ Chave privada guardada em `~/.tauri-keys/` ou variável de ambiente
- ✅ Nunca commitou a chave privada
- ✅ Chave pública no `tauri.conf.json`
- ✅ Arquivo `.sig` gerado durante build
- ✅ JSON de updates inclui a assinatura
- ✅ HTTPS recomendado para servir updates (segurança)

### Teste de Updates

1. Build com a versão 0.1.0
2. Incremente para 0.2.0 em package.json e tauri.conf.json
3. Build novamente
4. Configure o endpoint apontando para um servidor local
5. Execute o app em desenvolvimento
6. Clique em "Verificar Atualizações" em Settings
7. Deve mostrar a nova versão disponível

### Troubleshooting

**"Update signature verification failed"**
- Verifique se a assinatura no JSON corresponde ao arquivo
- Confirme se a chave pública está correta

**"Invalid public key"**
- Gere novas chaves com `npx tauri signer generate`

**"Endpoint not found"**
- Verifique a URL em `tauri.conf.json`
- Teste a URL no browser
