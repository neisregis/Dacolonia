document.addEventListener('DOMContentLoaded', function() {
    // Verifica se a API do Telegram WebApp está disponível
    if (window.Telegram && window.Telegram.WebApp) {
        console.log("Telegram WebApp API disponível.", window.Telegram);
        window.Telegram.WebApp.ready();
    } else {
        console.error("Telegram WebApp API não está disponível.");
    }

    // Função para obter parâmetros da URL
    function getParameterByName(name) {
        const url = new URL(window.location.href);
        return url.searchParams.get(name);
    }

    // Obtém o código do representante e supervisor da URL
    const repCode = getParameterByName('repCode');
    const supCode = getParameterByName('supCode');

    let selecionado = null; // Armazena o item selecionado (grupo ou cliente)

    // Função para destacar o item selecionado
    function selecionarItem(item) {
        if (selecionado) {
            selecionado.classList.remove('selecionado');
        }
        item.classList.add('selecionado');
        selecionado = item;
    }

    // Caminho para o arquivo JSON
    const url = 'https://neisregis.github.io/Dacolonia/superv_rep_grupo_cli.json';

    // Função para exibir clientes com funcionalidade de abrir/fechar grupos
    function exibirClientes(clientesPorGrupo) {
        const lista = document.getElementById('listaClientes');
        lista.innerHTML = ''; // Limpa a lista anterior

        Object.keys(clientesPorGrupo).forEach(grupo => {
            // Cria o item de grupo
            const grupoItem = document.createElement('li');
            grupoItem.classList.add('grupo');
            grupoItem.addEventListener('click', () => selecionarItem(grupoItem)); // Seleção do grupo
            
            const toggleButton = document.createElement('button');
            toggleButton.classList.add('toggle-button');
            toggleButton.textContent = '+';
            
            const grupoTexto = document.createElement('span');
            grupoTexto.textContent = `${grupo}`; // Exibe diretamente o nome do grupo

            grupoItem.appendChild(toggleButton);
            grupoItem.appendChild(grupoTexto);
            lista.appendChild(grupoItem);

            // Cria a lista de clientes escondida inicialmente
            const subLista = document.createElement('ul');
            subLista.classList.add('clientes');
            
            clientesPorGrupo[grupo].forEach(cliente => {
                const clienteItem = document.createElement('li');
                clienteItem.classList.add('cliente-item');
                clienteItem.textContent = `${cliente.codigo_cliente} - ${cliente.desc_cliente}`;
                clienteItem.addEventListener('click', (event) => {
                    event.stopPropagation(); // Evita que o clique no cliente selecione o grupo
                    selecionarItem(clienteItem); // Seleção do cliente
                });
                subLista.appendChild(clienteItem);
            });

            lista.appendChild(subLista);

            // Evento de clique para abrir/fechar a lista de clientes
            toggleButton.addEventListener('click', function() {
                if (subLista.style.display === 'none' || subLista.style.display === '') {
                    subLista.style.display = 'block';
                    toggleButton.textContent = '-';
                } else {
                    subLista.style.display = 'none';
                    toggleButton.textContent = '+';
                }
            });
        });
    }

    // Faz a requisição e filtra os clientes pelo código do representante ou supervisor
    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log(data); // Verifica o conteúdo do JSON no console

            if (supCode) {
                // Filtragem pelo código do supervisor
                if (data[supCode]) {
                    const representantes = data[supCode]['representantes'];
                    let clientesPorGrupo = {};

                    Object.values(representantes).forEach(grupos => {
                        Object.keys(grupos).forEach(grupo => {
                            if (!clientesPorGrupo[grupo]) {
                                clientesPorGrupo[grupo] = [];
                            }
                            clientesPorGrupo[grupo] = clientesPorGrupo[grupo].concat(grupos[grupo]);
                        });
                    });

                    // Exibe os clientes na página
                    exibirClientes(clientesPorGrupo);
                } else {
                    document.getElementById('listaClientes').innerHTML = 'Nenhum cliente encontrado para este supervisor.';
                }
            } else if (repCode) {
                // Filtragem pelo código do representante
                let encontrado = false;
                Object.keys(data).forEach(sup => {
                    const representantes = data[sup]['representantes'];
                    if (representantes[repCode]) {
                        encontrado = true;
                        const clientesPorGrupo = representantes[repCode];
                        exibirClientes(clientesPorGrupo);
                    }
                });

                if (!encontrado) {
                    document.getElementById('listaClientes').innerHTML = 'Nenhum cliente encontrado para este representante.';
                }
            } else {
                document.getElementById('listaClientes').innerHTML = 'Nenhum código de supervisor ou representante fornecido.';
            }
        })
        .catch(error => console.error('Erro ao buscar os dados:', error));

    // Função para enviar dados para o Telegram e fechar o WebApp
    document.getElementById('enviarBtn').addEventListener('click', function() {
        if (selecionado) {
            console.log("Item selecionado:", selecionado);

            let message = '';
            if (selecionado.classList.contains('grupo')) {
                message = `Grupo selecionado: ${selecionado.textContent}`;
            } else if (selecionado.classList.contains('cliente-item')) {
                message = `Cliente selecionado: ${selecionado.textContent}`;
            }

            console.log("Mensagem a ser enviada para o Telegram:", message);

            // Tenta enviar a mensagem para o chat do Telegram
            try {
                window.Telegram.WebApp.sendData(message);
                console.log("Mensagem enviada para o Telegram: ", message);

                // Fechar o WebApp após enviar a mensagem
                window.Telegram.WebApp.close();
                console.log("WebApp fechado.");
            } catch (error) {
                console.error("Erro ao enviar a mensagem para o Telegram:", error);
            }
        } else {
            alert('Nenhum cliente ou grupo foi selecionado.');
        }
    });
});
