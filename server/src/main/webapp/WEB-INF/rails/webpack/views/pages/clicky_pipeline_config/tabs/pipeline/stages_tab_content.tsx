/*
 * Copyright 2020 ThoughtWorks, Inc.
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

import {ApiResult} from "helpers/api_request_builder";
import {MithrilComponent} from "jsx/mithril-component";
import m from "mithril";
import Stream from "mithril/stream";
import {
  DependentPipeline,
  PipelineStructureWithAdditionalInfo
} from "models/internal_pipeline_structure/pipeline_structure";
import {PipelineStructureCRUD} from "models/internal_pipeline_structure/pipeline_structure_crud";
import {PipelineConfig} from "models/pipeline_configs/pipeline_config";
import {Template, TemplateCache} from "models/pipeline_configs/templates_cache";
import {TemplateConfig} from "models/pipeline_configs/template_config";
import {FlashMessageModelWithTimeout} from "views/components/flash_message";
import {PipelineConfigPage, PipelineConfigRouteParams} from "views/pages/clicky_pipeline_config/pipeline_config";
import {ConfigurationTypeWidget} from "views/pages/clicky_pipeline_config/tabs/pipeline/stage/configuration_type_widget";
import {PipelineTemplateWidget} from "views/pages/clicky_pipeline_config/tabs/pipeline/stage/pipeline_template_widget";
import {StagesWidget} from "views/pages/clicky_pipeline_config/tabs/pipeline/stage/stages_widget";
import {TabContent} from "views/pages/clicky_pipeline_config/tabs/tab_content";

export class StagesTabContent extends TabContent<PipelineConfig> {
  private isPipelineDefinedOriginallyFromTemplate: Stream<boolean> = Stream();
  private stageOrTemplateProperty: Stream<"template" | "stage">    = Stream();
  private dependentPipelines: Stream<DependentPipeline[]>          = Stream([] as DependentPipeline[]);

  private cache: TemplateCache          = new TemplateCache();
  private templates: Stream<Template[]> = Stream();

  constructor() {
    super();
    this.fetchStageDependencyInformation(PipelineConfigPage.routeInfo().params.pipeline_name);

    const self = this;
    self.cache.prime(() => {
      self.templates(self.cache.contents() as Template[]);
    }, () => {
      self.templates([] as Template[]);
    });
  }

  static tabName(): string {
    return "Stages";
  }

  public shouldShowSaveAndResetButtons(): boolean {
    return this.stageOrTemplateProperty() === "template" && (this.templates() && this.templates().length > 0);
  }

  protected selectedEntity(pipelineConfig: PipelineConfig, routeParams: PipelineConfigRouteParams): PipelineConfig {
    //initialize only once
    if (this.isPipelineDefinedOriginallyFromTemplate() === undefined) {
      this.isPipelineDefinedOriginallyFromTemplate(pipelineConfig.isUsingTemplate());
      m.redraw();
    }

    if (!this.stageOrTemplateProperty()) {
      this.stageOrTemplateProperty = Stream(pipelineConfig.isUsingTemplate() ? "template" : "stage");
      m.redraw();
    }

    return pipelineConfig;
  }

  protected renderer(entity: PipelineConfig,
                     templateConfig: TemplateConfig,
                     flashMessage: FlashMessageModelWithTimeout,
                     save: () => any,
                     reset: () => any) {

    return <StagesOrTemplatesWidget entity={entity}
                                    templateConfig={templateConfig}
                                    isPipelineDefinedOriginallyFromTemplate={this.isPipelineDefinedOriginallyFromTemplate}
                                    stageOrTemplateProperty={this.stageOrTemplateProperty}
                                    flashMessage={flashMessage}
                                    dependentPipelines={this.dependentPipelines}
                                    templates={this.templates}
                                    save={save} reset={reset}/>;
  }

  private fetchStageDependencyInformation(pipelineName: string) {
    this.pageLoading();
    PipelineStructureCRUD.allPipelines("administer", "view")
                         .then((pipelineGroups: ApiResult<PipelineStructureWithAdditionalInfo>) => {
                           pipelineGroups.do((successResponse) => {
                             const pipeline          = successResponse.body.pipelineStructure.findPipeline(pipelineName)!;
                             this.dependentPipelines = pipeline.dependantPipelines;
                             this.pageLoaded();
                           });

                         }, this.pageLoadFailure.bind(this));
  }
}

interface StagesOrTemplatesAttrs {
  entity: PipelineConfig;
  templateConfig: TemplateConfig;
  flashMessage: FlashMessageModelWithTimeout;
  save: () => any;
  reset: () => any;
  dependentPipelines: Stream<DependentPipeline[]>;
  stageOrTemplateProperty: Stream<"template" | "stage">;
  isPipelineDefinedOriginallyFromTemplate: Stream<boolean>;
  templates: Stream<Template[]>;
}

interface StagesOrTemplatesState {
  isUsingTemplate: () => boolean;
  stageOrTemplatePropertyStream: (value?: string) => string;
}

export class StagesOrTemplatesWidget extends MithrilComponent<StagesOrTemplatesAttrs, StagesOrTemplatesState> {
  oninit(vnode: m.Vnode<StagesOrTemplatesAttrs, StagesOrTemplatesState>) {

    vnode.state.stageOrTemplatePropertyStream = (value?: string) => {
      if (value) {
        vnode.attrs.reset();
        vnode.attrs.stageOrTemplateProperty((value === "template") ? "template" : "stage");
      }

      return vnode.attrs.stageOrTemplateProperty();
    };

    vnode.state.isUsingTemplate = () => vnode.attrs.stageOrTemplateProperty() === "template";
  }

  view(vnode: m.Vnode<StagesOrTemplatesAttrs, StagesOrTemplatesState>) {
    const entity = vnode.attrs.entity;

    let stagesOrTemplatesView: m.Children;

    if (vnode.state.isUsingTemplate()) {
      stagesOrTemplatesView = <PipelineTemplateWidget pipelineConfig={entity}
                                                      templates={vnode.attrs.templates}/>;
    } else {
      stagesOrTemplatesView = <StagesWidget stages={entity.stages}
                                            dependentPipelines={vnode.attrs.dependentPipelines}
                                            isUsingTemplate={entity.isUsingTemplate()}
                                            flashMessage={vnode.attrs.flashMessage}
                                            pipelineConfigSave={vnode.attrs.save}
                                            pipelineConfigReset={vnode.attrs.reset}
                                            isEditable={!entity.origin().isDefinedInConfigRepo()}/>;
    }

    return [
      <ConfigurationTypeWidget pipelineConfig={entity}
                               isPipelineDefinedOriginallyFromTemplate={vnode.attrs.isPipelineDefinedOriginallyFromTemplate}
                               property={vnode.state.stageOrTemplatePropertyStream}/>,
      stagesOrTemplatesView
    ];
  }
}
