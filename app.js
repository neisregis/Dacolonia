document.addEventListener('DOMContentLoaded', function() {
    // Todo o código JavaScript vai dentro desta função
    
    // Função para obter parâmetros da URL
    function getParameterByName(name) {
        const url = new URL(window.location.href);
        return url.searchParams.get(name);
    }

    // Inicialização do Telegram WebApp
    window.Telegram.WebApp.ready();

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

    // Faz a requisição e exibe os dados
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

    // Botão de envio
    document.getElementById('enviarBtn').addEventListener('click', function() {
        if (selecionado) {
            let message = '';
            if (selecionado.classList.contains('grupo')) {
                if (selecionado.textContent.includes('1 - GERAL')) {
                    message = 'Não é possível gerar o relatório para o grupo Geral, por favor selecione outro Grupo ou Cliente';
                } else {
                    message = `Grupo selecionado: ${selecionado.textContent}`;
                }
            } else if (selecionado.classList.contains('cliente-item')) {
                message = `Cliente selecionado: ${selecionado.textContent}`;
            }
            alert(message); // Exibe o pop-up com as informações

            // Envia a mensagem para o chat do Telegram
            try {
                if (window.Telegram.WebApp) {
                    window.Telegram.WebApp.sendData(message);
                    window.Telegram.WebApp.close();
                }
            } catch (error) {
                console.error('Erro ao enviar dados para o Telegram:', error);
            }
        } else {
            alert('Nenhum cliente ou grupo foi selecionado.');
        }
    });
});
