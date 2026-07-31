# lazytypr

> Somente planejamento: ainda não existe implementação nem pacote para baixar.

lazytypr é um aplicativo desktop planejado, local-first, para ditado e tradução
de pt-BR para en-US no Windows 11 x64 e macOS 13+ em Apple silicon. O áudio será
processado apenas em memória, a inferência será local após downloads explícitos
dos modelos, todo resultado bem-sucedido será copiado e a colagem automática
será opcional.

O projeto exclui contas, inferência em nuvem, telemetria, analytics, atualizador
e catálogo remoto de modelos. Gravações nunca serão persistidas. O histórico de
texto será local e removível pelo usuário; consulte [PRIVACY.md](PRIVACY.md).

## Estado e roteiro

Este repositório contém somente especificações, políticas, proveniência e
planejamento GSD. A primeira fase de implementação provará um esqueleto Electron
seguro: atalho → resultado simulado → área de transferência → colagem opcional
com destino verificado. Consulte o [roteiro](.planning/ROADMAP.md) e o
[índice da documentação](docs/README.md).

## Padrões do produto

- Whisper Small para reconhecimento em inglês e português brasileiro.
- Qwen3.5 4B Q4_K_M via llama.cpp para tradução pt-BR → en-US.
- Atalhos no modo toque-para-iniciar/toque-para-parar.
- Somente cópia por padrão; colagem automática exige consentimento explícito.
- Modelos obtidos de revisões imutáveis do provedor após confirmação.

## Publicação e atribuição

O trabalho original do lazytypr usa a licença MIT. O projeto é inspirado pelo
[OpenWhispr](https://github.com/OpenWhispr/openwhispr), também MIT, na revisão
fixada no mapa de evidências. lazytypr é independente e não é afiliado nem
endossado pelo OpenWhispr ou pela IBM. Logos, ícones, capturas de tela e a marca
do OpenWhispr não serão usados.

Relatos de defeitos são bem-vindos. Pull requests externos exigem acordo prévio
com o mantenedor; leia [CONTRIBUTING.md](CONTRIBUTING.md).

English: [README.md](README.md).
