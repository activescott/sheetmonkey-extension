import Promise from 'bluebird';
import $ from 'jquery';
import msg from '../modules/msg';
import Diag from '../modules/diag';

const D = new Diag('options');
D.log('script loaded');

class Opt {
    constructor() {
        this.load();
        this.listen();
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
        return new Promise((resolve, reject) => { 
            let urls = this.list.children('option[data-url]').toArray().map(el => $(el).attr('data-url'));
            D.log('saving urls', urls);
            let storageData = { manifestUrls: urls };
            chrome.storage.sync.set(storageData, () => {
                if (chrome.runtime.lastError)
                    return reject(chrome.runtime.lastError);
                return resolve();
            });
        });
    }

    load() {
        return new Promise((resolve, reject) => {
            const defaultData = { manifestUrls: [] };
            chrome.storage.sync.get(defaultData, (storedData) => {
                if (chrome.runtime.lastError)
                    return reject(chrome.runtime.lastError);
                //now load options into UI:
                this.removeAllListItems();
                D.log('loaded urls:', storedData.manifestUrls);
                storedData.manifestUrls.forEach(url => this.addListItem(url));
                return resolve(storedData);
            });
        });
    }
}

const singleton = new Opt();