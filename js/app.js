import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3.15.2/dist/module.esm.js'
import * as docx from 'https://cdn.jsdelivr.net/npm/docx@9.5.1/+esm'
import fileSaver from 'https://cdn.jsdelivr.net/npm/file-saver@2.0.5/+esm'
import moment from 'https://cdn.jsdelivr.net/npm/moment@2.30.1/+esm'
import axios from 'https://cdn.jsdelivr.net/npm/axios@1.13.2/+esm'
import { toDocx } from 'https://cdn.jsdelivr.net/npm/docshift@0.0.73/+esm'

document.addEventListener("alpine:init", () => {
    Alpine.data("app", () => ({
        form: {
            nome_parte: "NOVA IGUACU",
            data_publicacao: moment().format('YYYY-MM-DD'),
        },
        logs: [],
        publicacoes: [],
        publicacoes_filtradas: [],
        loading: false,

        async submit() {
            this.logs = [];
            this.loading = true;
            await this.pesquisar();
            this.filtrar();
            await this.salvar();
            this.loading = false;
        },

        /** Pesquisar publicações */
        async pesquisar() {
            this.logs.push(`Pesquisando publicações para ${this.form.nome_parte} na data ${this.form.data_publicacao}`);

            const limite = 100;
            let pagina = 1;
            let items = [];
            this.publicacoes = [];

            do {
                let response = await axios.get('https://comunicaapi.pje.jus.br/api/v1/comunicacao', {
                    params: {
                        nomeParte: this.form.nome_parte,
                        dataDisponibilizacaoInicio: this.form.data_publicacao,
                        dataDisponibilizacaoFim: this.form.data_publicacao,
                        pagina: pagina
                    }
                });

                items = response.data.items;
                this.publicacoes.push(...items);
                ++pagina
            } while (items.length === 0 || items.length === limite);

            this.logs.push(`${this.publicacoes.length} publicações encontradas`);
        },

        filtrar() {
            this.logs.push(`Filtrando publicações`);

            const keywords = ['procuradoria', 'prefeitura', 'municipio'];

            this.publicacoes_filtradas = this.publicacoes.filter(pub => {
                return pub.destinatarios.some(dest => {

                    const nome = dest.nome.toLowerCase()
                        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                        .replace('-', ' ');

                    const input = this.form.nome_parte.toLowerCase()
                        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                        .replace('-', ' ');

                    if(!nome.includes(input)) {
                        return false;
                    }

                    return keywords.some(keyword => nome.includes(keyword));
                })
            })

            this.logs.push(`${this.publicacoes_filtradas.length} publicações filtradas`);
        },

        async salvar() {
            this.logs.push(`Salvando em arquivo .docx`);
            const parser = new DOMParser();

            let blocks = '';

            this.publicacoes.forEach(pub => {
                blocks += `
                    <p>
                        <span style="color: #004BCB"><strong>Processo ${pub.numeroprocessocommascara}</strong></span><br>
                        <span><strong>Órgão: </strong> ${pub.nomeOrgao}</span><br>
                        <span><strong>Data de disponibilização: </strong>${moment(pub.data_disponibilizacao).format('DD/MM/YYYY')}</span><br>
                        <span><strong>Tipo de comunicação: </strong>${pub.tipoComunicacao}</span><br>
                        <span><strong>Meio: </strong> ${pub.meiocompleto}</span><br>
                        <span><strong>Parte(s): </strong></span><br>
                        ${pub.destinatarios.map( dest => `<span>${dest.nome}<span><br>`).join('')}
                        ${pub.destinatarioadvogados.length ? `<span><strong>Advogado(s): </strong></span><br>` : ''}
                        ${pub.destinatarioadvogados.length ? pub.destinatarioadvogados.map( dest => `<span>${dest.advogado.nome}<span><br>`).join('') : ''}
                        <br>
                        <section">${pub.texto}</section><br>
                        <br>
                    </p>
                `
            });

            const html = `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                </head>
                <body style="font-family: 'Calibri Light'; font-size: 13px">
                    ${ blocks }
                </body>
                </html>`;

            const converter = window.htmlDocx.asBlob;
            const docxBlob = await converter(html);
            fileSaver.saveAs(docxBlob, "teste.docx");

            this.logs.push(`Concluído!`);
        },
    }));
});

Alpine.start()