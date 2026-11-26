# HomeBuilder

📌 Guia de Colaboração do Projeto
Organização do Desenvolvimento

Para manter o projeto organizado e evitar conflitos entre os desenvolvedores, cada integrante deverá seguir algumas regras durante o desenvolvimento.

1. Criação de Branch

Cada desenvolvedor deverá criar uma branch com seu próprio nome para realizar suas alterações.

2. Escolha da Parte do Código

Após criar sua branch, cada desenvolvedor deverá escolher qual parte do código deseja desenvolver ou modificar.

É importante que cada integrante defina previamente sua área de atuação para evitar que duas pessoas trabalhem na mesma parte do código sem alinhamento.

3. Desenvolvimento
Cada desenvolvedor deverá realizar suas alterações exclusivamente em sua própria branch.
Evite modificar arquivos que não estejam relacionados à sua tarefa.
Faça commits frequentes, com mensagens claras sobre as alterações realizadas.
4. Envio das Alterações

Quando finalizar sua parte, o desenvolvedor deverá enviar as alterações para o GitHub:

bash
git add .
git commit -m "Descrição das alterações"
git push origin nome-do-desenvolvedor

5. Integração do Código

Após concluir o desenvolvimento, deverá ser aberto um Pull Request (PR) para que as alterações sejam revisadas e posteriormente integradas à branch principal (main).

⚠️ Regras Importantes
Cada desenvolvedor deve trabalhar em sua própria branch.
Cada branch deve possuir o nome do respectivo desenvolvedor.
Defina qual parte do código será trabalhada antes de começar.
Não faça alterações diretamente na branch main.
Mantenha o código organizado e documentado.
Comunique-se com a equipe para evitar conflitos e retrabalho.

Objetivo: manter o desenvolvimento organizado, facilitar a colaboração entre os integrantes e evitar conflitos durante a integração do código.

## Como executar e jogar

Inicie um servidor local na pasta `jogo`:

```powershell
py -3.9 -m http.server 8000 --directory ".\jogo"
```

Abra `http://localhost:8000` no navegador. O fluxo do jogo é:

1. Gere um cliente aleatório e crie o briefing.
2. Importe o briefing no Arquiteto, desenhe a planta e exporte o JSON.
3. Importe a planta no Construtor e conclua todos os elementos.
4. Envie a obra para validação e passe o JSON exportado ao cliente.
5. Na etapa **Validação do cliente**, importe o JSON recebido. O cliente pode aprovar a obra quando todos os requisitos, o orçamento e o prazo forem atendidos, ou solicitar ajustes.
6. Exporte a resposta do cliente em JSON e devolva-a ao construtor.
