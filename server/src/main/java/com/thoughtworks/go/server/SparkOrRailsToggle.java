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

package com.thoughtworks.go.server;

import com.thoughtworks.go.server.service.support.toggle.Toggles;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class SparkOrRailsToggle {
    public void backupApi(HttpServletRequest request, HttpServletResponse response) {
        basedOnToggle(Toggles.SPARK_BACKUP_ENABLED_KEY, request);
    }

    public void currentUserApi(HttpServletRequest request, HttpServletResponse response) {
        basedOnToggle(Toggles.SPARK_CURRENT_USER_ENABLED_KEY, request);
    }

    public void encryptionApi(HttpServletRequest request, HttpServletResponse response) {
        basedOnToggle(Toggles.SPARK_ENCRYPTION_ENABLED_KEY, request);
    }

    public void rolesConfigApi(HttpServletRequest request, HttpServletResponse response) {
        basedOnToggle(Toggles.SPARK_ROLE_CONFIG_ENABLED_KEY, request);
    }

    public void pluginImagesApi(HttpServletRequest request, HttpServletResponse response) {
        basedOnToggle(Toggles.SPARK_PLUGIN_IMAGES_ENABLED_KEY, request);
    }

    public void oldOrNewDashboard(HttpServletRequest request, HttpServletResponse response) {
        request.setAttribute("rails_bound", true);

        if (Toggles.isToggleOn(Toggles.NEW_DASHBOARD_PAGE_DEFAULT)) {
            request.setAttribute("newUrl", "/rails/new_dashboard");
        } else {
            request.setAttribute("newUrl", "/rails/pipelines");
        }
    }

    private void basedOnToggle(String toggle, HttpServletRequest request) {
        if (Toggles.isToggleOn(toggle)) {
            request.setAttribute("sparkOrRails", "spark");
        } else {
            request.setAttribute("sparkOrRails", "rails");
        }
    }

}
