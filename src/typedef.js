/**
 * @typedef {Object} Package
 * @property {string} name
 * @property {string} displayName
 * @property {string} main
 */

/**
 * @typedef {Object} Plugin
 * @property {Array<import("electron").MenuItemConstructorOptions>} menu
 * @property {string} serverPath
 * @property {PluginServer} server
 * 
 * @callback PluginServer
 * @returns {import("express").Router}
 */