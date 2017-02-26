import Promise from 'bluebird';
import $ from 'jquery';
import msg from '../modules/msg';
import Storage from '../modules/storage';
import Diag from '../modules/diag';

const D = new Diag('options');
D.log('script loaded');

class Opt {
    constructor() {
        this.load();
        this.listen();
        this.messenger = msg.init('options', {
            loadPluginUrls: (done) => {
                D.log('loadPluginUrls message received!');
                Storage.loadUrls().then(urls => {
                    done(urls);
                });
            }
        });
    }

    listen() {
        $(() => {
            this.setUIDisabledState();

            this.addButton.on('click', e => {
                return this.promptPromise('Enter the URL of the plugin\'s manifest:').then(url => {
                     //build the option:
                    if (url == null || url.trim().length == 0)
                        return null;
                    this.addListItem(url);
                    this.saveAndLoad();
                    return null;
                }).catch(err => {
                    D.warn('Prompt canceled.', err);
                });
            });

            this.removeButton.on('click', e => {
                this.removeListItems(this.selectedOptions);
                this.saveAndLoad();
            });

            $('input#url').on('input', this.setUIDisabledState.bind(this));
            this.list.on('input', this.setUIDisabledState.bind(this));

        });
    }

    promptPromise(message) {
        return new Promise(function(resolve, reject) {
            var result = window.prompt(message);
            if (result != null) {
                return resolve(result);
            } else {
                return reject(new Error('User cancelled'));
            }
        });
    }

    setUIDisabledState() {
        let disable = this.selectedOptions.length == 0;
        this.removeButton.prop("disabled", disable);
    }

    get addButton() {
        return $('button#add');
    }

    get removeButton() {
        return $('button#remove');
    }

    saveAndLoad() {
        this.save().then(() => {
            D.log('saved.');
            this.load().then(() => D.log('loaded.'));
        });
    }

    removeListItems(optionEl) {
        optionEl.remove();
        //trigger change event when select>option is removed/added.
        this.list.trigger('input');
    }

    addListItem(val) {
        const opt = $('<option>');
        opt.attr('data-url', val);
        opt.text(val);
        this.list.append(opt);
        //trigger change event when select>option is removed/added.
        this.list.trigger('input');
    }

    removeAllListItems() {
        this.list.children('option').remove();
    }

    get list() {
        return $('select#plugins').first();
    }
    
    get selectedOptions() {
        return this.list.children('option:selected');
    }
    
    save() {
        let urls = this.list.children('option[data-url]').toArray().map(el => $(el).attr('data-url'));
        return Storage.savePluginUrls(urls).then(() => D.log('urls saved.'));
    }

    load() {
        return Storage.loadPluginUrls().then(urls => {
            //now load options into UI:
            this.removeAllListItems();
            urls.forEach(url => this.addListItem(url));
        });
    }
}

const singleton = new Opt();