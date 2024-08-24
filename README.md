# Computação Gráfica
### Neste repositório estão presentes 2 trabalhos da disciplina de computação gráfica. 
(T1) - Este projeto é um sistema de geração procedural de cenários utilizando WebGL e JavaScript. Ele permite a criação dinâmica de diferentes ambientes, como florestas, cidades ou castelos, com configurações ajustáveis através de controles de interface. Este ambiente foca na geração procedural de uma floresta.(Uso exclusivo no site)

(T2) - Implementação de sombreamento em uma cena, onde é nos dado uma situação de Hard Shadow e devemos implementar a Soft Shadow no lugar.

##### Cred: 
###### Miguel Rodrigues Botelho
###### Discord: botlane
###### Email: miguel.rbotelho@gmail.com
###### Link para Vídeo: https://drive.google.com/drive/folders/1-HkbHitqq4V1jaRpWGIAC-iCr31gzVQO?usp=drive_link

## Funcionalidades Implementadas (T1)
#### Objetos Implementados:
###### Grama
###### Quatro tipos diferentes de árvores
###### Pedra
#### Regras e Especificações:

###### Grama e Pedra: Restrição de colocação no chão.
###### Árvores: Restrição de colocação no chão e distância mínima entre outras árvores.
#### Controles de Interface:

###### Sliders para ajuste de densidade de grama, número de objetos e tamanho da floresta.
###### Campo para inserção de semente para geração aleatória de cenários.

#### Botão de Geração:
###### Botão que ao ser pressionado gera um novo cenário com base nas configurações atuais.

#### Problemas:
##### Otimização de Tela:

##### A otimização para diferentes tamanhos de tela não está completamente funcional.
##### Renderização de Texturas:

##### As texturas não estão sendo renderizadas conforme o esperado.
##### Implementação do Perlin Noise:
##### A implementação do Perlin Noise não foi concluída.

#### Pré-requisitos:
###### Navegador com suporte a WebGL.

#### Uso:
###### Ajuste os sliders para configurar a densidade de grama, número de objetos e tamanho da floresta.
###### Clique no botão "Gerar Novo Mundo" para visualizar um novo cenário com as configurações definidas.


## Lógica Implementada (T2)

#### A partir de um código de hard shadow de uma cena, foi implementado a versão com umbra e penumbra da mesma cena, no caso há uma transição de hard shadow para soft shadow, para isso foi implementado a lógica de shadow mapping com a técnica de PCF. 

### Dificuldades Encontradas:

#### No geral, no código para o site foi relativamente tranquilo, mantive-o como base na tentativa de aplicar a lógica no trabalho da geração procedural, porém me atrapalhei e não consegui implementar. A princípio foi desenvolvido somente para a aplicação no site.
