document.addEventListener('DOMContentLoaded', function() {
    // Verifica se a API do Telegram WebApp está disponível
    if (window.Telegram && window.Telegram.WebApp) {
        console.log("Telegram WebApp API disponível.", window.Telegram);
        window.Telegram.WebApp.ready();
    } else {
        console.error("Telegram WebApp API não está disponível.");
    }

    function getParameterByName(name) {
        const url = new URL(window.location.href);
        return url.searchParams.get(name);
    }

    const repCode = getParameterByName('repCode');
    const supCode = getParameterByName('supCode');
    let selecionado = null;

    function selecionarItem(item) {
        if (selecionado) {
            selecionado.classList.remove('selecionado');
        }
        item.classList.add('selecionado');
        selecionado = item;
    }

    const url = './superv_rep_grupo_cli.json';

    function exibirClientes(clientesPorGrupo) {
        const lista = document.getElementById('listaClientes');
        lista.innerHTML = '';

        Object.keys(clientesPorGrupo).forEach(grupo => {
            const grupoItem = document.createElement('li');
            grupoItem.classList.add('grupo');
            grupoItem.addEventListener('click', () => selecionarItem(grupoItem));
            
            const toggleButton = document.createElement('button');
            toggleButton.classList.add('toggle-button');
            toggleButton.textContent = '+';
            
            const grupoTexto = document.createElement('span');
            grupoTexto.textContent = `${grupo}`;

            grupoItem.appendChild(toggleButton);
            grupoItem.appendChild(grupoTexto);
            lista.appendChild(grupoItem);

            const subLista = document.createElement('ul');
            subLista.classList.add('clientes');
            
            clientesPorGrupo[grupo].forEach(cliente => {
                const clienteItem = document.createElement('li');
                clienteItem.classList.add('cliente-item');
                clienteItem.textContent = `${cliente.codigo_cliente} - ${cliente.desc_cliente}`;
                clienteItem.addEventListener('click', (event) => {
                    event.stopPropagation();
                    selecionarItem(clienteItem);
                });
                subLista.appendChild(clienteItem);
            });

            lista.appendChild(subLista);

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

    // Adiciona um listener de evento para o campo de filtro
    const filterInput = document.getElementById('filterInput');
    if (filterInput) {
        filterInput.addEventListener('input', function () {
            const query = this.value.toLowerCase();
            console.log("Texto digitado no filtro:", query); // Verificação
            filtrarClientes(query);
        });
    } else {
        console.error("Campo de filtro não encontrado!");
    }

    function filtrarClientes(query) {
		const lista = document.getElementById('listaClientes');
		const grupos = lista.querySelectorAll('.grupo');

		// Verifica se o campo de filtro está vazio
		const filtroVazio = query.trim() === '';

		grupos.forEach(grupoItem => {
			const grupoNome = grupoItem.querySelector('span').textContent.toLowerCase();
			const subLista = grupoItem.nextElementSibling;

			let grupoVisivel = false;
			const clientes = subLista.querySelectorAll('.cliente-item');
			clientes.forEach(clienteItem => {
				const clienteNome = clienteItem.textContent.toLowerCase();
				const clienteVisivel = clienteNome.includes(query) || grupoNome.includes(query);
				clienteItem.style.display = clienteVisivel ? '' : 'none';
				grupoVisivel = grupoVisivel || clienteVisivel;
			});

			// Exibe ou oculta o grupo e a lista de clientes conforme o filtro
			grupoItem.style.display = grupoVisivel || grupoNome.includes(query) ? '' : 'none';
			subLista.style.display = (filtroVazio || !grupoVisivel) ? 'none' : 'block';
			
			// Define o texto do botão com base na visibilidade da sublista
			const toggleButton = grupoItem.querySelector('.toggle-button');
			toggleButton.textContent = subLista.style.display === 'none' ? '+' : '-';
		});
	}

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar o JSON');
            }
            return response.json();
        })
        .then(data => {
            console.log("Dados carregados:", data);

            if (supCode) {
                if (data[supCode]) {
                    const representantes = data[supCode]['representantes'];
                    let clientesPorGrupo = {};

                    Object.values(representantes).forEach(grupos => {
                        Object.keys(grupos).forEach(grupo => {
                            if (!clientesPorGrupo[grupo]) {
                                clientesPorGrupo[grupo] = [];
                            }
                            clientesPorGrupo[grupo] = clientesPorGrupo[grupo]
                                .concat(grupos[grupo])
                                .filter(cliente => cliente && cliente.desc_cliente)
                                .sort((a, b) => a.desc_cliente.localeCompare(b.desc_cliente));
                        });
                    });

                    exibirClientes(clientesPorGrupo);
                } else {
                    document.getElementById('listaClientes').innerHTML = 'Nenhum cliente encontrado para este supervisor.';
                }
            } else if (repCode) {
                let encontrado = false;
                Object.keys(data).forEach(sup => {
                    const representantes = data[sup]['representantes'];
                    if (representantes[repCode]) {
                        encontrado = true;
                        const clientesPorGrupo = representantes[repCode];

                        Object.keys(clientesPorGrupo).forEach(grupo => {
                            clientesPorGrupo[grupo] = clientesPorGrupo[grupo]
                                .filter(cliente => cliente && cliente.desc_cliente)
                                .sort((a, b) => a.desc_cliente.localeCompare(b.desc_cliente));
                        });

                        exibirClientes(clientesPorGrupo);
                    }
                });

                if (!encontrado) {
                    document.getElementById('listaClientes').innerHTML = 'Nenhum cliente encontrado para este representante.';
                }
            } else {
                let clientesPorGrupo = {};

                Object.keys(data).forEach(sup => {
                    const representantes = data[sup]['representantes'];
                    Object.values(representantes).forEach(grupos => {
                        Object.keys(grupos).forEach(grupo => {
                            if (!clientesPorGrupo[grupo]) {
                                clientesPorGrupo[grupo] = [];
                            }
                            clientesPorGrupo[grupo] = clientesPorGrupo[grupo]
                                .concat(grupos[grupo])
                                .filter(cliente => cliente && cliente.desc_cliente)
                                .sort((a, b) => a.desc_cliente.localeCompare(b.desc_cliente));
                        });
                    });
                });

                exibirClientes(clientesPorGrupo);
            }
        })
        .catch(error => console.error('Erro ao buscar os dados:', error));

    document.getElementById('enviarBtn').addEventListener('click', function() {
        if (selecionado) {
            let message = '';

            if (selecionado.classList.contains('grupo') && selecionado.textContent.includes('1 - GERAL')) {
                alert("Não é possível gerar o relatório para o grupo '1 - GERAL', por favor, selecione outro Grupo / Cliente");
                return;
            } else if (selecionado.classList.contains('grupo')) {
                message = `Grupo selecionado: ${selecionado.textContent}`;
            } else if (selecionado.classList.contains('cliente-item')) {
                message = `Cliente selecionado: ${selecionado.textContent}`;
            }

            const confirmacao = confirm(`Você selecionou: ${selecionado.textContent}. Deseja enviar esta informação?`);
            if (confirmacao) {
                console.log("Mensagem a ser enviada para o Telegram:", message);

                try {
                    window.Telegram.WebApp.sendData(message);
                    console.log("Mensagem enviada para o Telegram: ", message);

                    window.Telegram.WebApp.close();
                    console.log("WebApp fechado.");
                } catch (error) {
                    console.error("Erro ao enviar a mensagem para o Telegram:", error);
                }
            }
        } else {
            alert('Nenhum cliente ou grupo foi selecionado.');
        }
    });
});
