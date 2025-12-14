import axios from 'https://cdn.jsdelivr.net/npm/axios@1.13.2/+esm'
import axiosRetry from 'https://cdn.jsdelivr.net/npm/axios-retry@4.5.0/+esm'

const client = axios.create({ baseURL: 'https://comunicaapi.pje.jus.br/api/v1' });
axiosRetry(client, { retries: 6, retryDelay: axiosRetry.exponentialDelay });

const djen = {

    async publicacoes({ nomeParte, dataDisponibilizacaoInicio, dataDisponibilizacaoFim } = {}) {

        const limite = 100;
        let pagina = 1;
        let items = [];
        let publicacoes = []

        do {
            let response = await client.get(`/comunicacao`, {
                params: {
                    nomeParte: nomeParte,
                    dataDisponibilizacaoInicio: dataDisponibilizacaoInicio,
                    dataDisponibilizacaoFim: dataDisponibilizacaoFim,
                    pagina: pagina,
                    itensPorPagina: limite
                }
            });
            items = response.data.items;
            publicacoes.push(...items);
            ++pagina
        } while (items.length !== 0 || items.length === limite);

        return publicacoes;
    }
}

export default djen;