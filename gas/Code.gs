/**
 * おんどくはかせの ちょうせんじょう ― Google Apps Script の「入口」ページ
 *
 * Apps Script の画面の中ではマイクが使えないため、アプリ本体は GitHub Pages で公開し、
 * この入口ページの「はじめる」ボタンからアプリ本体を開きます。
 *
 * 使い方
 *   1. Apps Script のプロジェクトに、このファイル（Code.gs）と start.html を作る
 *   2. 下の APP_URL を、GitHub Pages で公開したアプリのURLにする
 *   3. 「デプロイ」→「新しいデプロイ」→ 種類「ウェブアプリ」で公開する
 */
const APP_URL = 'https://zku0395-ops.github.io/hori/';

function doGet() {
  const template = HtmlService.createTemplateFromFile('start');
  template.appUrl = APP_URL;
  return template.evaluate()
    .setTitle('おんどくはかせの ちょうせんじょう')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
