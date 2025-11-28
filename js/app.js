import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3.15.2/dist/module.esm.js'
import * as docx from 'https://cdn.jsdelivr.net/npm/docx@9.5.1/+esm'
import fileSaver from 'https://cdn.jsdelivr.net/npm/file-saver@2.0.5/+esm'
import moment from 'https://cdn.jsdelivr.net/npm/moment@2.30.1/+esm'
import { toDocx } from 'https://cdn.jsdelivr.net/npm/docshift@0.0.73/+esm'
import Logger from './logger.js'
import djen from './djen.js'
import { filtrarPublicacoes } from  './utils.js'

document.addEventListener("alpine:init", () => {
    Alpine.data("app", () => ({
        form: {
            nomeParte: "NOVA IGUACU",
            dataPublicacao: moment().format('YYYY-MM-DD'),
        },
        logger: Alpine.reactive(new Logger()),
        keywords: ['procuradoria', 'prefeitura', 'municipio'],
        publicacoes: [],
        publicacoesFiltradas: [],
        loading: false,

        async submit() {
            this.loading = true;
            this.logger.clear()

            try {
                /** Pesquisar */
                this.logger.add('⏳',`Pesquisando publicações para ${this.form.nomeParte} em ${moment(this.form.dataPublicacao).format('DD/MM/YYYY')}`);
                await this.pesquisar();
                if(this.publicacoes.length === 0) return this.logger.add('⛔',`Nenhuma publicação encontrada`);
                this.logger.add('ℹ️',`${this.publicacoes.length} publicações encontradas`);
    
                /** Filtrar */
                this.logger.add('⏳', `Filtrando publicações`);
                this.publicacoesFiltradas = filtrarPublicacoes(this.publicacoes, this.keywords, this.form.nomeParte);
                if(this.publicacoesFiltradas.length === 0) return this.logger.add('⛔',`Nenhuma publicação filtrada`);
                this.logger.add('ℹ️', `${this.publicacoesFiltradas.length} publicações filtradas`);
    
                /** Salvar */
                this.logger.add('⏳', `Salvando em arquivo .docx`);
                await this.salvar();
                this.logger.add('✅', `Concluído!`);
            } finally {
                this.loading = false;
            }
        },

        async pesquisar() {
            try {
                this.publicacoes = await djen.publicacoes({ 
                    nomeParte: this.form.nomeParte,
                    dataDisponibilizacaoInicio: this.form.dataPublicacao,
                    dataDisponibilizacaoFim: this.form.dataPublicacao,
                });
            } catch (err) {
                this.logger.add('⛔', "Erro ao consultar publicações, tente novamente");
                throw(err);
            }
        },

        filtrar() {
            this.publicacoesFiltradas = this.publicacoes.filter(pub => {
                return pub.destinatarios.some(dest => {

                    const nome = dest.nome.toLowerCase()
                        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                        .replace('-', ' ');

                    const input = this.form.nomeParte.toLowerCase()
                        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                        .replace('-', ' ');

                    if(!nome.includes(input)) {
                        return false;
                    }

                    return this.keywords.some(keyword => nome.includes(keyword));
                })
            })
        },

        async salvar() {
            const parser = new DOMParser();

            let blocks = '';

            this.publicacoesFiltradas.forEach(pub => {
                blocks += `
                    <p>
                        <span class="publicacao-title">Processo ${pub.numeroprocessocommascara}</span><br>
                        <span><strong>Órgão: </strong> ${pub.nomeOrgao}</span><br>
                        <span><strong>Data de disponibilização: </strong>${moment(pub.data_disponibilizacao).format('DD/MM/YYYY')}</span><br>
                        <span><strong>Tipo de comunicação: </strong>${pub.tipoComunicacao}</span><br>
                        <span><strong>Meio: </strong> ${pub.meiocompleto}</span><br>
                        ${pub.link ? `<span><strong>Inteiro teor: </strong></span>` : ''}
                        ${pub.link ? `<a href="${pub.link}">Clique aqui</a><br>` : ''}
                        <span><strong>Parte(s): </strong></span><br>
                        ${pub.destinatarios.map( dest => `<span>${dest.nome}<span><br>`).join('')}
                        ${pub.destinatarioadvogados.length ? `<span><strong>Advogado(s): </strong></span><br>` : ''}
                        ${pub.destinatarioadvogados.length ? pub.destinatarioadvogados.map( dest => `<span>${dest.advogado.nome} - OAB ${dest.advogado.uf_oab}-${dest.advogado.numero_oab}<span><br>`).join('') : ''}
                        <section">${pub.texto}</section><br>
                        <br>
                    </p>
                `
            });

            const html = `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <style>
                        .publicacao-title {
                            color: #004BCB !important;
                            font-weight: bold;
                        }

                        strong {
                            color: #0A243B;
                        }

                        a {
                            text-decoration: none;
                        }
                    </style>
                </head>
                <body style="font-family: 'Calibri Light'; font-size: 13px; color: #4C4C4C">
                    ${ blocks }
                </body>
                </html>`;

            const converter = window.htmlDocx.asBlob;
            const docxBlob = await converter(html);
            fileSaver.saveAs(docxBlob, `publicações-${moment().format('DD-MM-YYYY')}.docx`);

      
        },
    }));
});

Alpine.start()