/*
 * Copyright (c) 2017 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-view',
    'contrail-list-model',
], function (_, ContrailView, ContrailListModel) {
    var databaseNodeListView = ContrailView.extend({
        el: $(contentContainer),

        render: function () {
            var self = this;
            var viewConfig = this.attributes.viewConfig;
            var listModelConfig = {
                remote: {
                    ajaxConfig: {
                        url: ctwc.URL_GET_CONFIG_DETAILS,
                        type: "POST",
                        data: JSON.stringify({data: [{type: "database-nodes"}]})
                    },
                    dataParser: self.parseDatabaseNodeData,
                }
            };
            var contrailListModel = new ContrailListModel(listModelConfig);
            this.renderView4Config(this.$el,
                    contrailListModel, getDatabaseNodeGridViewConfig());
        },

        parseDatabaseNodeData : function(result){
            var gridDS = [];
            var databaseNodes = getValueByJsonPath(result,
                "0;database-nodes", []);
            _.each(databaseNodes, function(databaseNode){
                gridDS.push(databaseNode["database-node"]);
            });
            return gridDS;
        }
    });

    var getDatabaseNodeGridViewConfig = function () {
        return {
            elementId: cowu.formatElementId([ctwc.CONFIG_DATABASE_NODE_SECTION_ID]),
            view: "SectionView",
            viewConfig: {
                rows: [
                    {
                        columns: [
                            {
                                elementId: ctwc.CONFIG_DATABASE_NODE_ID,
                                view: "databaseNodeCfgGridView",
                                viewPathPrefix: "config/infra/nodes/ui/js/views/",
                                app: cowc.APP_CONTRAIL_CONTROLLER,
                                viewConfig: {
                                    pagerOptions: {
                                        options: {
                                            pageSize: 10,
                                            pageSizeSelect: [10, 50, 100]
                                        }
                                    }
                                }
                            }
                        ]
                    }
                ]
            }
        }
    };

    return databaseNodeListView;
});

