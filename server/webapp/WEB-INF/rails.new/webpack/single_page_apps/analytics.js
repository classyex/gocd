/*
 * Copyright 2018 ThoughtWorks, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function() {
  "use strict";

  const m = require("mithril");
  const $ = require("jquery");

  require("foundation-sites");
  require('helpers/server_health_messages_helper');

  const PluginEndpoint           = require('rails-shared/plugin-endpoint');
  const VersionUpdater           = require('models/shared/version_updater');
  const Frame                    = require('models/analytics/frame');
  const AnalyticsDashboardHeader = require('views/analytics/header');
  const PluginiFrameWidget       = require('views/analytics/plugin_iframe_widget');
  const Routes                   = require('gen/js-routes');

  const models = {};

  function ensureModel(uid, pluginId, type, id) {
    let model = models[uid];

    if (!model) {
      model = models[uid] = new Frame(m.redraw);
      model.url(Routes.showAnalyticsPath(pluginId, type, id)); // eslint-disable-line camelcase
    }

    return model;
  }

  PluginEndpoint.ensure();

  PluginEndpoint.define({
    "analytics.job.history": (message, trans) => {
      const meta = message.head;
      const model = models[meta.uid];
      const params = $.extend({plugin_id: meta.pluginId}, message.body); // eslint-disable-line camelcase

      params.start = JSON.stringify(params.start).replace(/"/g, "");
      params.end = JSON.stringify(params.end).replace(/"/g, "");

      model.fetch(Routes.jobAnalyticsPath(params), (data, errors) => {
        trans.respond({data, errors});
      });
    },

    "analytics.pipeline": (message, reply) => { // eslint-disable-line no-unused-vars
      const meta = message.head;
      const model = models[meta.uid];
      model.url(Routes.pipelineAnalyticsPath({plugin_id: meta.pluginId, pipeline_name: message.body.pipelineName})); // eslint-disable-line camelcase
      model.load();
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    const main = document.querySelector("[data-supported-dashboard-metrics]");

    m.mount(main, {
      view() {
        const frames = [];
        frames.push(m(AnalyticsDashboardHeader));
        $.each($(main).data("supported-dashboard-metrics"), (pluginId, supportedAnalytics) => {
          $.each(supportedAnalytics, (idx, sa) => {
            const uid = `f-${pluginId}:${sa.id}:${idx}`,
              model = ensureModel(uid, pluginId, sa.type, sa.id);

            frames.push(m(PluginiFrameWidget, {model, pluginId, uid, init: PluginEndpoint.init}));
          });
        });
        return frames;
      }
    });

    // boilerplate to init menus and check for updates
    $(document).foundation();
    new VersionUpdater().update();
  });
})();
