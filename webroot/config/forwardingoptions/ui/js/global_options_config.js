/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

fwdOptionsConfigObj = new ForwardingOptionsConfigObj();

function ForwardingOptionsConfigObj() {
    this.load = load;
    this.init = init;
    this.destroy = destroy;
    this.initComponents = initComponents;
	this.createEPEntry = createEPEntry;
	this.appendEPEntry = appendEPEntry
	this.deleteEPEntry = deleteEPEntry; 
	this.clearEPEntries = clearEPEntries;
	this.populateData = populateData;
    this.appendFlowAgingTimeoutEntry = appendFlowAgingTimeoutEntry;
    this.createFlowAgingTimeoutEntry = createFlowAgingTimeoutEntry;
    this.deleteFlowAgingTimeoutEntry = deleteFlowAgingTimeoutEntry;
    this.clearFlowAgingTimeoutEntries = clearFlowAgingTimeoutEntries;
	this.validate = validate;
    //Variable definitions
    //Dropdowns

    //Buttons
    var btnSaveFwdOptions, btnCnfSaveCancel, btnCnfSaveOK;
    var confirmMainSave;
}

function load() {
    var configTemplate = Handlebars.compile($("#fwdoptions-config-template").html());
    $(contentContainer).html('');
    $(contentContainer).html(configTemplate);
    currTab = 'config_infra_fwdoptions';
    init();
}

function initComponents() {
    dynamicID = 0;
    dynamicFlowAgingTimeoutID = 0;
    $("#gridGlobalConfig").contrailGrid({
        header : {
            title : {
                text : 'Global Config',
            },
            customControls: ['<a id="btnEditGblConfig" onclick="showGblConfigEditWindow();return false;" title="Edit Global Config"><i class="icon-edit"></i></a>']
        },
        columnHeader : {
            columns : [
            {
                id: "property",
                field: "property",
                name: "Configuration Option",
                maxWidth : 300,
                sortable: false
            },
            {
                id: "value",
                field: "value",
                name: "Value",
                maxWidth : 500,
                sortable: false,
                formatter: function(r, c, v, cd, dc) {
                    if(dc.property === 'Encapsulation Priority Order') {
                        var ele = '';
                        if(dc.value.length > 0) {
                            for(var i = 0; i < dc.value.length; i++) {
                                var item = dc.value[i];
                                if(ele === ''){
                                    ele = '<span>' + item + '</span>'
                                } else {
                                    ele += '<br><span>' + item + '</span>'
                                }
                            }
                        } else {
                            ele = '-';
                        }
                        return ele;
                    } else if(dc.property === 'iBGP Auto Mesh') {
                        if(dc.value) {
                            return 'Enabled';
                        } else {
                            return "Disabled";
                        }
                    } else if(dc.property === 'IP Fabric Subnets') {
                        var ele = '';
                        if(dc.value.length > 0) {
                            for(var i = 0; i < dc.value.length ; i++) {
                                var item = dc.value[i];
                                if(ele === ''){
                                    ele = '<span>' + item.ip_prefix + '/' + item.ip_prefix_len + '</span>'
                                } else {
                                    ele += '<br><span>' + item.ip_prefix + '/' + item.ip_prefix_len + '</span>'
                                }                                
                            }
                        } else {
                            ele = '-';
                        }
                        return ele;
                    } else if(dc.property === 'Flow Export Rate') {
                        if(null !== dc.value && typeof dc.value === "string" &&
                            dc.value.trim() !== "") {
                            return dc.value;
                        } else {
                            return "-";
                        }
                    } else {
                        return dc.value;
                    }
                }
            }]
        },
        body : {
            options : {
                forceFitColumns: true,
                editable: false,
                autoEdit: false
            },
            dataSource : {
                data : []
            },
            statusMessages: {
                loading: {
                    text: 'Loading Global Config..',
                },
                empty: {
                    text: 'No Global Config Found.'
                }, 
                errorGettingData: {
                    type: 'error',
                    iconClasses: 'icon-warning',
                    text: 'Error in getting Global Config.'
                }
            }
        },
        footer : false
    });

    var forwardingModeLabels = ["Default","L2 and L3","L2 Only", "L3 Only"];
    var forwardingModeValues = ["default", "l2_l3", "l2", "l3"];
    var forwardingModeData = [];

    for (var i = 0; i < forwardingModeLabels.length; i++) {
        var fwdModeData = {
            text: forwardingModeLabels[i],
            value: forwardingModeValues[i]
        };
        forwardingModeData.push(fwdModeData);
    }

    gridGlobalConfig = $("#gridGlobalConfig").data('contrailGrid');
    $('#ddForwardingMode').contrailDropdown({
        dataTextField:"text",
        dataValueField:"value"
    });
    $('#ddForwardingMode')
        .data('contrailDropdown')
        .setData(forwardingModeData);

	confirmMainSave = $("#confirmMainSave");
	confirmMainSave.modal({backdrop:'static', keyboard: false, show:false});
    windowEditGblConfig = $('#windowEditGblConfig');
    windowEditGblConfig.modal({backdrop:'static', keyboard: false, show:false});
}

function showGblConfigEditWindow() {
    windowEditGblConfig.find('h6.modal-header-title').text('Edit Global Config');
    setEditPopupData();
    windowEditGblConfig.modal('show');
}

function getGasnJSON() {
    var gasn_params = {};
    var gasn = $("#txtgasn").val().trim();
    ggasn = gasn;
    gasn_params = {
        "global-system-config":{
            "_type":ggasnObj._type,
            "uuid":ggasnObj.uuid,
            "autonomous_system":parseInt(gasn)
        }
    };
    return gasn_params;
}

function getiBGPAutoMeshJSON() {
    var ibgpAutoMeshObj = {};
    var autoMeshCkd =  $('#chk_ibgp_auto_mesh')[0].checked;
    ibgpAutoMeshObj = {
        "global-system-config":{
            "_type":ggasnObj._type,
            "uuid":ggasnObj.uuid,
            "ibgp_auto_mesh":autoMeshCkd
        }
    };
    return ibgpAutoMeshObj;
}

function isPriorityChanged(oldPriority, newPriority) {
    if(oldPriority.length != newPriority.length) {
        return true;
    } else {
        for(var i = 0; i < oldPriority.length; i++) {
            if(oldPriority[i] != newPriority[i]) {
                return true;
            }
        }
    }
    return false;
}

function isIPFabricSubnetChanged(oldSubnets, newSubnets) {
    if(oldSubnets.length != newSubnets.length) {
        return true;
    } else {
        for(var i = 0; i < oldSubnets.length; i++) {
            if(oldSubnets[i].ip_prefix != newSubnets[i].ip_prefix
                || oldSubnets[i].ip_prefix_len != newSubnets[i].ip_prefix_len) {
                return true;    
            }
        }        
    }
    return false;
}

function getModifiedSubnets() {
    var subnetList = [];
    var subnetTuples = $("#subnetTuples")[0].children;
    if (subnetTuples && subnetTuples.length > 0) {
        for (var i = 0; i < subnetTuples.length; i++) {
            var id = getID(String($("#subnetTuples").children()[i].id));
            var cidr = $("#subnetTuples_"+id+"_txtCIDR").val().trim();
            cidr = cidr.split('/');
            subnetList.push({"ip_prefix" : cidr[0], "ip_prefix_len" : parseInt(cidr[1], 10)});
        }
    }
    return subnetList;
}

function getipFabricSubnetsJSON() {
    var ipFabricSubnetsObj = {};
    var subnetObj = {};
    var subnetList = getModifiedSubnets();;
    subnetObj = {"subnet" : subnetList}
    ipFabricSubnetsObj = {
        "global-system-config":{
            "_type":ggasnObj._type,
            "uuid":ggasnObj.uuid,
            "ip_fabric_subnets":subnetObj
        }
    };
    return ipFabricSubnetsObj;
}

function initActions() {
    $('#btnEditGblConfigOK').click(function (a) {
        if(!validate()) {
            return false;
        }
        gridGlobalConfig._dataView.setData([]);
        gridGlobalConfig.showGridMessage('loading');
        var globalVRouterConfig = {};
        var ajaxArry = [];
        var fwdOptnURL, fwdOptnActionType;;
        globalVRouterConfig["global-vrouter-config"] = {};
        var vxlanid = $('input:radio[name=vxlanMode]:checked').val();
        globalVRouterConfig["global-vrouter-config"]["vxlan_network_identifier_mode"] = vxlanid;
        
        var priorities = [];
        var epTuples = $("#epTuples")[0].children;
        var epTuples = $("#epTuples")[0].children;
        if (epTuples && epTuples.length > 0) {
        	var encapsulationLabels = ["MPLS Over GRE","MPLS Over UDP","VxLAN"];
        	var encapsulationValues = ["MPLSoGRE","MPLSoUDP","VXLAN"];

        	for (var i = 0; i < epTuples.length; i++) {
        		var epTuple = $($($(epTuples[i]).find("div")[0]).find("div")[0]);
                var priority = $($(epTuple).find("div.span12")[1]).data("contrailDropdown").text();
                if(encapsulationLabels.indexOf(priority) !== -1) {
                	priorities.push(encapsulationValues[encapsulationLabels.indexOf(priority)]);	
                }
        	}
        }
        if(vxlanid === "configured" && priorities.indexOf("VXLAN") === -1) {
        	showInfoWindow("Encapsulation type 'VxLAN' is required while setting VxLAN identifier mode.", "Input Required");
        	return false;
        }
        windowEditGblConfig.modal('hide');
        if(priorities.length > 0) {
        	globalVRouterConfig["global-vrouter-config"]["encapsulation_priorities"] = {};
        	globalVRouterConfig["global-vrouter-config"]["encapsulation_priorities"]["encapsulation"] = [];
        	for(var i=0; i<priorities.length; i++) {
        		globalVRouterConfig["global-vrouter-config"]["encapsulation_priorities"]["encapsulation"][i] = priorities[i];
        	}
        }
        var forwarding_mode = $("#ddForwardingMode").data("contrailDropdown").value();
        var flowExportRate = $("#txtFlowExportRate").val()
        if(null === configObj["global-vrouter-config"] ||
        	typeof configObj["global-vrouter-config"] === "undefined" ||
        	null === configObj["global-vrouter-config"]["uuid"] ||
        	typeof configObj["global-vrouter-config"]["uuid"] === "undefined") {
            /*doAjaxCall("/api/tenants/config/global-vrouter-configs", "POST", JSON.stringify(globalVRouterConfig),
                    null, "handleCommitFailure");*/
            fwdOptnURL = "/api/tenants/config/global-vrouter-configs";
            fwdOptnActionType = "POST";
        } else {
            var gvrId = configObj["global-vrouter-config"]["uuid"];
            /*doAjaxCall("/api/tenants/config/global-vrouter-config/" + gvrId + "/forwarding-options",
            	"PUT", JSON.stringify(globalVRouterConfig), null, "handleCommitFailure");*/

            if(forwarding_mode === "default") {
                //if tag 'forwarding_mode' is missing, just like in case of an upgrade,
                //dont add 'forwarding_mode' since user is still going with 'default'.
                //if(null !== configObj["global-vrouter-config"]["forwarding_mode"] &&
                //    typeof configObj["global-vrouter-config"]["forwarding_mode"] !== "undefined") {
                    //Adding 'forwarde_mode' tag if it is already there.
                    globalVRouterConfig["global-vrouter-config"]["forwarding_mode"] = null;
                //  }
            } else {
                //Add forwarding_mode only for l2_l3, l2, l3.
                globalVRouterConfig["global-vrouter-config"]["forwarding_mode"] = forwarding_mode;
            }
            if(null !== flowExportRate && typeof flowExportRate === "string" &&
                flowExportRate.trim() !== "") {
                globalVRouterConfig["global-vrouter-config"]["flow_export_rate"] = parseInt(flowExportRate);
            } else {
                globalVRouterConfig["global-vrouter-config"]["flow_export_rate"] = null;
            }
            fwdOptnURL = "/api/tenants/config/global-vrouter-config/" + gvrId + "/forwarding-options";
            fwdOptnActionType = "PUT";
        }
        var forwardingModeChanged = false;
        if(orig_forwarding_mode !== forwarding_mode) {
            forwardingModeChanged = true;
            if(("" + orig_forwarding_mode + forwarding_mode).trim() === "null") {
                forwardingModeChanged = false;
            } 
        }
        /* Flow Aging Timeout*/
        var flowAgingTimeoutTuples = $("#flowAgingTimeoutTuples")[0].children;
        if (flowAgingTimeoutTuples && flowAgingTimeoutTuples.length > 0) {
            var flowAgingTimeoutList = [];
            for (var i = 0; i < flowAgingTimeoutTuples.length; i++) {
                var id = getID(String($("#flowAgingTimeoutTuples").children()[i].id));
                var protocol =  $('#flowAgingTimeoutTuples_' + id + '_comboProtocol').data('contrailCombobox').value();
                var port = $('#flowAgingTimeoutTuples_' + id + '_txtPort').val();
                port = port != null && port.trim() != '' ? parseInt(port) : 0;
                var timeout = $('#flowAgingTimeoutTuples_' + id + '_txtTimeout').val();
                timeout = timeout != null && timeout.trim() != '' ? parseInt(timeout) : 180;
                flowAgingTimeoutList.push({timeout_in_seconds : timeout, protocol : protocol, port : port});
            }
            globalVRouterConfig["global-vrouter-config"]['flow_aging_timeout_list'] =
                { flow_aging_timeout : flowAgingTimeoutList };
        } else {
            globalVRouterConfig["global-vrouter-config"]['flow_aging_timeout_list'] = null;
        }

        //post url for forwarding options
        ajaxArry.push($.ajax({
           url : fwdOptnURL,
           type : fwdOptnActionType,
           contentType : "application/json; charset=utf-8",
           data : JSON.stringify(globalVRouterConfig)
        }));
        var autoMeshCkd =  $('#chk_ibgp_auto_mesh')[0].checked;
        var isASNSerialFlow = ($("#txtgasn").val().trim() !== ggasn.toString() && isiBGPAutoMesh != autoMeshCkd) ? true : false;
        if(isASNSerialFlow) {
            doAjaxCall("/api/tenants/admin/config/global-asn", "PUT", JSON.stringify(getGasnJSON()), "successASNUpdate", "failureASNUpdate");
        } else {
            //post url for global asn
            if($("#txtgasn").val().trim() !== ggasn.toString()) {
                ajaxArry.push($.ajax({
                   url : "/api/tenants/admin/config/global-asn",
                   type : "PUT",
                   contentType : "application/json; charset=utf-8",
                   data : JSON.stringify(getGasnJSON())
                }));
            }

            //post url for iBGP Auto Mesh
            if(isiBGPAutoMesh != autoMeshCkd) {
                ajaxArry.push($.ajax({
                   url : "/api/tenants/admin/config/ibgp-auto-mesh",
                   type : "PUT",
                   contentType : "application/json; charset=utf-8",
                   data : JSON.stringify(getiBGPAutoMeshJSON())
                }));
            }
        }
        
        //post url for ip fabric subnets
        if(isIPFabricSubnetChanged(ipFabricSubnets, getModifiedSubnets())) {
            ajaxArry.push($.ajax({
               url : "/api/tenants/admin/config/ip-fabric-subnets",
               type : "PUT",
               contentType : "application/json; charset=utf-8",
               data : JSON.stringify(getipFabricSubnetsJSON())
            }));
        }        
        
        $.when.apply($, ajaxArry).then(
            function () {
                //all success
                if(!isASNSerialFlow) {
                    fetchData();
                }
            },
            function (error) {
                //If atleast one api fails
                showInfoWindow(error.responseText, error.statusText);
                if(!isASNSerialFlow) {
                    fetchData();
                }
            });
    });
}

function successASNUpdate() {
    doAjaxCall("/api/tenants/admin/config/ibgp-auto-mesh", "PUT", JSON.stringify(getiBGPAutoMeshJSON()), "successiAutoMeshUpdate", "failureiAutoMeshUpdate");
}

function failureASNUpdate() {
    fetchData();
}

function successiAutoMeshUpdate() {
    fetchData();
}

function failureiAutoMeshUpdate() {
    fetchData();
}

function getID(divid){
    if(divid === undefined){
         return -1;
    }
    var split = divid.split("_");
    if(split.length > 1){
        return(split[1])
    } else {
        return -1;
    }
}

function handleCommitFailure(result) {
	showInfoWindow("Error in saving configuration.", "Error", result);
	fetchData();
}

function setEditPopupData() {
    $('input:radio[name="vxlanMode"][value="' + actVxlan + '"]').attr('checked',true);
    $("#ddForwardingMode").data('contrailDropdown').value(
        (orig_forwarding_mode === "" || null === orig_forwarding_mode) ? 
            "default" : orig_forwarding_mode);
    $("#epTuples").html("");
    for(var i=0; i<actPriorities.length; i++) {
        var epEntry = createEPEntry(actPriorities[i], i);
        $("#epTuples").append(epEntry);
    }
    $('#txtgasn').val(ggasn);
    $("#txtFlowExportRate").val(actFlowExportRate);
    if(isiBGPAutoMesh) {
         $('#chk_ibgp_auto_mesh').attr('checked', 'checked');
    } else {
        $('#chk_ibgp_auto_mesh').removeAttr('checked');
    }
    $("#subnetTuples").html("");
    for(var i=0; i<ipFabricSubnets.length; i++) {
        var subnetEntry = createSubnetEntry(ipFabricSubnets[i], i);
        $("#subnetTuples").append(subnetEntry);
    }
     /*Flow Aging Timeout */
     $("#flowAgingTimeoutTuples").html("");
    for(var i = 0; i < flowAgingTimeoutList.length; i++) {
        var flowAgingTimeout = createFlowAgingTimeoutEntry(flowAgingTimeoutList[i], i);
         $("#flowAgingTimeoutTuples").append(flowAgingTimeout);
    }
}

function populateData(result) {
	var vxLanIdentifierModeLabels = ["Auto Configured", "User Configured"];
	var vxLanIdentifierModeValues = ["automatic", "configured"];
    var encapsulationMap = {"MPLSoGRE":"MPLS Over GRE", "MPLSoUDP":"MPLS Over UDP", "VXLAN":"VxLAN"};
    var fwdModeMap = {"default" : "Default", "l2_l3" : "L2 and L3", "l2" : "L2 Only", "l3" : "L3 Only"};
    var gridDS = [];
    var priorities;
    var strFlowAgingTimeout = "";
    orig_forwarding_mode = "";
    $("#epTuples").html("");
	if(null !== result) {
		gvrConfig = result["global-vrouter-config"];
		configObj["global-vrouter-config"] = {};
		configObj["global-vrouter-config"] = result["global-vrouter-config"];
		if(null !== gvrConfig["vxlan_network_identifier_mode"] && 
			typeof gvrConfig["vxlan_network_identifier_mode"] !== "undefined") {
            actVxlan = gvrConfig["vxlan_network_identifier_mode"];
		} else {
			//Set default 'automatic' for VxLANIdentifierMode
            actVxlan = vxLanIdentifierModeValues[0];
		}
        if(null !== gvrConfig["flow_export_rate"] && 
            typeof gvrConfig["flow_export_rate"] !== "undefined") {
            actFlowExportRate = gvrConfig["flow_export_rate"]+"";
        } else {
            actFlowExportRate = "";
        }
        if(null !== gvrConfig["forwarding_mode"] && 
            typeof gvrConfig["forwarding_mode"] !== "undefined") {
            orig_forwarding_mode = gvrConfig["forwarding_mode"];
        } else {
            orig_forwarding_mode = null;
        }

		if(null !== gvrConfig["encapsulation_priorities"] && 
			typeof gvrConfig["encapsulation_priorities"] !== "undefined" &&
			null !== gvrConfig["encapsulation_priorities"]["encapsulation"] &&
			typeof gvrConfig["encapsulation_priorities"]["encapsulation"] !== "undefined" &&
			gvrConfig["encapsulation_priorities"]["encapsulation"].length > 0) {
			priorities = gvrConfig["encapsulation_priorities"]["encapsulation"];
			for(var i=0; i<priorities.length; i++) {
				var epEntry = createEPEntry(priorities[i], i);
				$("#epTuples").append(epEntry);
			}
		} else {
			//Add default MPLSoGRE even if nothing is configured. TBD
			var epEntry = createEPEntry("MPLSoGRE", 0);
			$("#epTuples").append(epEntry);
		}
        /* Flow Aging Timeout */
        flowAgingTimeoutList = getValueByJsonPath(result,
            'global-vrouter-config;flow_aging_timeout_list;flow_aging_timeout', []);
        if(flowAgingTimeoutList.length > 0 ) {
            for(var i = 0; i < flowAgingTimeoutList.length; i++) {
                strFlowAgingTimeout += "Protocol: " +
                    flowAgingTimeoutList[i]['protocol'].toUpperCase();
                strFlowAgingTimeout += ", Port: " + flowAgingTimeoutList[i]['port'];
                strFlowAgingTimeout += ", Timeout: " + flowAgingTimeoutList [i]['timeout_in_seconds']
                    + ' seconds';
                strFlowAgingTimeout += '<br>';
            }
        } else {
            strFlowAgingTimeout = '-';
        }

	} else {
		//Set default 'automatic' for VxLANIdentifierMode
        actVxlan = vxLanIdentifierModeValues[0];
        actFlowExportRate = "";
        $("#txtFlowExportRate").val("")
		//Add default MPLSoGRE even if nothing is configured. TBD
		var epEntry = createEPEntry("MPLSoUDP", 0);
		$("#epTuples").append(epEntry);
		epEntry = createEPEntry("MPLSoGRE", 1);
		$("#epTuples").append(epEntry);
		epEntry = createEPEntry("VXLAN", 2);
		$("#epTuples").append(epEntry);
        strFlowAgingTimeout = '-';
	}
    //prepare grid data
    gridDS.push({'property' : 'Forwarding Mode', 'value': (null === orig_forwarding_mode || (typeof orig_forwarding_mode === "string" &&
        orig_forwarding_mode.trim() === "" )) ? fwdModeMap["default"] : fwdModeMap[orig_forwarding_mode]});
    var vxLanText = (actVxlan === vxLanIdentifierModeValues[0] ) ? vxLanIdentifierModeLabels[0] : vxLanIdentifierModeLabels[1];
    gridDS.push({'property' : 'VxLAN Identifier Mode', 'value' : vxLanText});
    if(priorities != null) {
        actPriorities = priorities;
        var gridPriorities = [];
        for(var i = 0; i < priorities.length; i++) {
            gridPriorities.push(encapsulationMap[priorities[i]]);
        }
        gridDS.push({'property' : 'Encapsulation Priority Order', 
            'value' : gridPriorities});
    } else {
        actPriorities = ["MPLSoUDP", "MPLSoGRE", "VXLAN"];
        gridDS.push({'property' : 'Encapsulation Priority Order', 'value' : ["MPLS Over UDP", "MPLS Over GRE", "VxLAN"]});
    }
    gridDS.push({'property' : 'Flow Export Rate', 'value' : actFlowExportRate});
    gridDS.push({'property' : 'Flow Aging Timeout', 'value' : strFlowAgingTimeout});
    gridDS.push({'property' : 'Global ASN', 'value' : ggasn});
    gridDS.push({'property' : 'iBGP Auto Mesh', 'value' : isiBGPAutoMesh});
    gridDS.push({'property' : 'IP Fabric Subnets', 'value':ipFabricSubnets});
    gridGlobalConfig._dataView.setData(gridDS);
}


function fetchData() {
    configObj["global-vrouter-config"] = {};
   gridGlobalConfig._dataView.setData([]);
   gridGlobalConfig.showGridMessage('loading');
    doAjaxCall(
    	"/api/tenants/config/global-vrouter-config", "GET",
        null, "successHandlerForGblVrouterConfig", "failureHandlerForGblVrouterConfig", null, null);
}

function successHandlerForGblVrouterConfig(gblVrouterCfgData) {
    fetchGblSystemConfigData(gblVrouterCfgData);
}

function failureHandlerForGblVrouterConfig(error) {
    gridGlobalConfig.showGridMessage('errorGettingData');
}

function fetchGblSystemConfigData(gblVrouterCfgData) {
    $.ajax({
        type:"GET",
        cache:false,
        url:"/api/tenants/admin/config/global-asn"
    }).success(function (res) {
            ggasnObj = jsonPath(res, "$.*")[0];
            ggasn = ggasnObj["autonomous_system"];
            isiBGPAutoMesh = ggasnObj['ibgp_auto_mesh'] == null ? true : ggasnObj['ibgp_auto_mesh'];
            ipFabricSubnets = ggasnObj['ip_fabric_subnets'] != null && ggasnObj['ip_fabric_subnets']['subnet'] != null
                                  && ggasnObj['ip_fabric_subnets']['subnet'].length > 0 ? ggasnObj['ip_fabric_subnets']['subnet'] : [];
            populateData(gblVrouterCfgData);
        }).fail(function (msg) {
            if(msg && msg.statusText !== "abort") {
                //showInfoWindow("Error in getting Global ASN.", "Error");
                gridGlobalConfig.showGridMessage('errorGettingData');
            }
        });
}

function init() {
    this.initComponents();
    this.initActions();
    this.fetchData();
}

function createEPEntry(ep, len) {
	var encapsulationLabels = ["MPLS Over GRE","MPLS Over UDP","VxLAN"];
	var encapsulationValues = ["MPLSoGRE","MPLSoUDP","VXLAN"];

    var selectPriorities = document.createElement("div");
    selectPriorities.className = "span12";

    var divPriorities = document.createElement("div");
    divPriorities.className = "span5 margin-0-0-5";
    divPriorities.setAttribute("style", "width: 44%; margin-left:150px !important;");
    divPriorities.appendChild(selectPriorities);
    
    var iBtnAddRule = document.createElement("i");
    iBtnAddRule.className = "icon-plus";
    iBtnAddRule.setAttribute("onclick", "appendEPEntry(this);");
    iBtnAddRule.setAttribute("title", "Add Encapsulation Priority below");

    var divPullLeftMargin5Plus = document.createElement("div");
    divPullLeftMargin5Plus.className = "pull-left margin-5";
    divPullLeftMargin5Plus.appendChild(iBtnAddRule);

    var iBtnDeleteRule = document.createElement("i");
    iBtnDeleteRule.className = "icon-minus";
    iBtnDeleteRule.setAttribute("onclick", "deleteEPEntry(this);");
    iBtnDeleteRule.setAttribute("title", "Delete Encapsulation Priority");

    var divPullLeftMargin5Minus = document.createElement("div");
    divPullLeftMargin5Minus.className = "pull-left margin-5";
    divPullLeftMargin5Minus.appendChild(iBtnDeleteRule);

    var divRowFluidMargin5 = document.createElement("div");
    divRowFluidMargin5.className = "row-fluid margin-0-0-5";
    divRowFluidMargin5.appendChild(divPriorities);
    divRowFluidMargin5.appendChild(divPullLeftMargin5Plus);
    divRowFluidMargin5.appendChild(divPullLeftMargin5Minus);

    var rootDiv = document.createElement("div");
    rootDiv.appendChild(divRowFluidMargin5);

    $(selectPriorities).contrailDropdown({
        data: [
            {
                id: encapsulationValues[0],
                text: encapsulationLabels[0]
            },
            {
                id: encapsulationValues[1],
                text: encapsulationLabels[1]
            },
            {
                id: encapsulationValues[2],
                text: encapsulationLabels[2]
            }
        ]
    });
    
    if (null !== ep && typeof ep !== "undefined") {
    	$(selectPriorities).data("contrailDropdown").value(ep);
    } else {
        var existing = [];
        var epTuples = $("#epTuples")[0].children;
        if (epTuples && epTuples.length > 0) {
        	for (var i = 0; i < epTuples.length; i++) {
        		var epTuple = $($(epTuples[i]).find("div")[0]).children();
                var priority = $($(epTuple).find("div.select2-offscreen")[0]).data("contrailDropdown").text();
                existing.push(priority);
        	}
        	var available = encapsulationLabels.diff(existing);
        	if(available.length >0)
        		$(selectPriorities).data("contrailDropdown").text(available[0]);
        }
    }

    return rootDiv;
}

function appendEPEntry(who, defaultRow) {
	var len = $("#epTuples").children().length;
	if(len >= 3) {
		return false;
	}
    var epEntry = createEPEntry(null, len);
    if (defaultRow) {
        $("#epTuples").append($(epEntry));
    } else {
        var parentEl = who.parentNode.parentNode.parentNode;
        parentEl.parentNode.insertBefore(epEntry, parentEl.nextSibling);
    }
}

function deleteEPEntry(who) {
    var epTuples = $("#epTuples")[0].children;
    if (epTuples && epTuples.length == 1) {
        showInfoWindow("Atleast one encapsulation priority is required.", "Invalid Action");
        return false;
    }
    var templateDiv = who.parentNode.parentNode.parentNode;
    $(templateDiv).remove();
    templateDiv = $();
}

function clearEPEntries() {
    var tuples = $("#epTuples")[0].children;
    if (tuples && tuples.length > 0) {
        var tupleLength = tuples.length;
        for (var i = 0; i < tupleLength; i++) {
            $(tuples[i]).empty();
        }
        $(tuples).empty();
        $("#epTuples").empty();
    }
}

function createSubnetEntry(subnet, len) {
    dynamicID++;
    id =  dynamicID;
    var inputTxtPoolName = document.createElement("input");
    inputTxtPoolName.type = "text";
    inputTxtPoolName.className = "span12";
    inputTxtPoolName.setAttribute("placeholder", "CIDR");
    inputTxtPoolName.setAttribute("id","subnetTuples_"+id+"_txtCIDR");
    var divPoolName = document.createElement("div");
    divPoolName.className = "span5";
    divPoolName.setAttribute("style", "width: 44%; margin-left:110px !important;");
    divPoolName.appendChild(inputTxtPoolName);

    
    var iBtnAddRule = document.createElement("i");
    iBtnAddRule.className = "icon-plus";
    iBtnAddRule.setAttribute("onclick", "appendSubnetEntry(this);");
    iBtnAddRule.setAttribute("title", "Add CIDR below");

    var divPullLeftMargin5Plus = document.createElement("div");
    divPullLeftMargin5Plus.className = "pull-left margin-5";
    divPullLeftMargin5Plus.appendChild(iBtnAddRule);

    var iBtnDeleteRule = document.createElement("i");
    iBtnDeleteRule.className = "icon-minus";
    iBtnDeleteRule.setAttribute("onclick", "deleteSubnetEntry(this);");
    iBtnDeleteRule.setAttribute("title", "Delete FIP Pool");

    var divPullLeftMargin5Minus = document.createElement("div");
    divPullLeftMargin5Minus.className = "pull-left margin-5";
    divPullLeftMargin5Minus.appendChild(iBtnDeleteRule);

    var divRowFluidMargin5 = document.createElement("div");
    divRowFluidMargin5.className = "row-fluid margin-0-0-5";
    divRowFluidMargin5.appendChild(divPoolName);
    //divRowFluidMargin5.appendChild(divProjects);
    divRowFluidMargin5.appendChild(divPullLeftMargin5Plus);
    divRowFluidMargin5.appendChild(divPullLeftMargin5Minus);

    var rootDiv = document.createElement("div");
    rootDiv.id = "subnetTuples_"+id;
    rootDiv.appendChild(divRowFluidMargin5);

    if (null !== subnet && typeof subnet !== "undefined") {
        $(inputTxtPoolName).val(subnet.ip_prefix + '/' + subnet.ip_prefix_len);
    } else {
        $(inputTxtPoolName).val('');
    }

    return rootDiv;
}

function validateSubnetEntry() {
    var len = $("#subnetTuples").children().length;
    if(len > 0) {
        for(var i=0; i<len; i++) {
            var cidr =
                $($($($("#subnetTuples").children()[i]).find(".span5")[0]).find("input")).val().trim();
            if (typeof cidr === "undefined" || cidr === "") {
                showInfoWindow("Enter CIDR", "Input required");
                return false;
            }
            if ("" === cidr.trim() || !isValidIP(cidr.trim())) {
                showInfoWindow("Enter a valid CIDR", "Invalid input in CIDR");
                return false;
            }
            if(cidr.split("/").length != 2) {
                showInfoWindow("Enter a valid CIDR in xxx.xxx.xxx.xxx/xx format", "Invalid input in CIDR");
                return false;
            }
        }
    }
    return true;
}

function appendSubnetEntry(who, defaultRow) {
    if(validateSubnetEntry() === false)
        return false;

    var fipEntry = createSubnetEntry(null, $("#subnetTuples").children().length);
    if (defaultRow) {
        $("#subnetTuples").prepend($(fipEntry));
    } else {
        var parentEl = who.parentNode.parentNode.parentNode;
        parentEl.parentNode.insertBefore(fipEntry, parentEl.nextSibling);
    }
    //scrollUp("#windowCreateVN",fipEntry,false);
}

function deleteSubnetEntry(who) {
    var templateDiv = who.parentNode.parentNode.parentNode;
    $(templateDiv).remove();
    templateDiv = $();
}

/*start flow aging timeout section */

function appendFlowAgingTimeoutEntry(who, defaultRow) {
    if(validateFlowAgingTimeoutEntry() === false)
        return false;

    var fipEntry = createFlowAgingTimeoutEntry(null, $("#flowAgingTimeoutTuples").children().length);
    if (defaultRow) {
        $("#flowAgingTimeoutTuples").prepend($(fipEntry));
    } else {
        var parentEl = who.parentNode.parentNode.parentNode;
        parentEl.parentNode.insertBefore(fipEntry, parentEl.nextSibling);
    }
}

function deleteFlowAgingTimeoutEntry(who) {
    var templateDiv = who.parentNode.parentNode.parentNode;
    $(templateDiv).remove();
    templateDiv = $();
}

function clearFlowAgingTimeoutEntries() {
    var tuples = $("#flowAgingTimeoutTuples")[0].children;
    if (tuples && tuples.length > 0) {
        var tupleLength = tuples.length;
        for (var i = 0; i < tupleLength; i++) {
            $(tuples[i]).empty();
        }
        $(tuples).empty();
        $("#flowAgingTimeoutTuples").empty();
    }
}

function createFlowAgingTimeoutEntry(flowAgingTimeout, len) {
    dynamicFlowAgingTimeoutID++;
    var id =  dynamicFlowAgingTimeoutID;
    var protocolDiv = document.createElement("div");
    protocolDiv.className = "span12";
    protocolDiv.setAttribute("id", "flowAgingTimeoutTuples_" + id + "_comboProtocol");
    protocolDiv.setAttribute("style", "margin-left:7px;");
    var protocolParentDiv = document.createElement("div");
    protocolParentDiv.className = "span3";
    protocolParentDiv.appendChild(protocolDiv);

    var inputTxtPort = document.createElement("input");
    inputTxtPort.type = "text";
    inputTxtPort.className = "span12";
    inputTxtPort.setAttribute("placeholder", "All Ports");
    inputTxtPort.setAttribute("style", "margin-left:6px;");
    inputTxtPort.setAttribute("id", "flowAgingTimeoutTuples_" + id + "_txtPort");
    var portParentDiv = document.createElement("div");
    portParentDiv.className = "span3";
    portParentDiv.appendChild(inputTxtPort);

    var inputTxtTimeout = document.createElement("input");
    inputTxtTimeout.type = "text";
    inputTxtTimeout.className = "span12";
    inputTxtTimeout.setAttribute("placeholder", "180");
    inputTxtTimeout.setAttribute("style", "margin-left:6px;");
    inputTxtTimeout.setAttribute("id", "flowAgingTimeoutTuples_" + id + "_txtTimeout");
    var timeoutParentDiv = document.createElement("div");
    timeoutParentDiv.className = "span3";
    timeoutParentDiv.appendChild(inputTxtTimeout);

    var iBtnAddRule = document.createElement("i");
    iBtnAddRule.className = "icon-plus";
    iBtnAddRule.setAttribute("onclick", "appendFlowAgingTimeoutEntry(this);");
    iBtnAddRule.setAttribute("title", "Add Flow Aging Timeouts below");

    var divPullLeftMargin5Plus = document.createElement("div");
    divPullLeftMargin5Plus.className = "pull-left";
    divPullLeftMargin5Plus.setAttribute("style", "margin:5px 5px 5px 19px;");
    divPullLeftMargin5Plus.appendChild(iBtnAddRule);

    var iBtnDeleteRule = document.createElement("i");
    iBtnDeleteRule.className = "icon-minus";
    iBtnDeleteRule.setAttribute("onclick", "deleteFlowAgingTimeoutEntry(this);");
    iBtnDeleteRule.setAttribute("title", "Delete Flow Aging Timeout");

    var divPullLeftMargin5Minus = document.createElement("div");
    divPullLeftMargin5Minus.className = "pull-left margin-5";
    divPullLeftMargin5Minus.appendChild(iBtnDeleteRule);

    var divRowFluidMargin5 = document.createElement("div");
    divRowFluidMargin5.className = "row-fluid";
    divRowFluidMargin5.appendChild(protocolParentDiv);
    divRowFluidMargin5.appendChild(portParentDiv);
    divRowFluidMargin5.appendChild(timeoutParentDiv);
    divRowFluidMargin5.appendChild(divPullLeftMargin5Plus);
    divRowFluidMargin5.appendChild(divPullLeftMargin5Minus);

    var rootDiv = document.createElement("div");
    rootDiv.id = "rule_" + id;
    rootDiv.appendChild(divRowFluidMargin5);
    //instantiate and set data for protocol dropdown
    $(protocolDiv).contrailCombobox({
        dataTextField:"text",
        dataValueField:"value",
        placeholder:"Protocol Code",
        change:function(args){
            var parentElement =
                args.target.parentElement.parentElement.parentElement.parentElement;
                var id = getID(String(parentElement.id));
                var portocolValue = $('#flowAgingTimeoutTuples_' + id + '_comboProtocol').data('contrailCombobox').value();
                if(portocolValue === 'icmp' || portocolValue === '1'){
                    $('#flowAgingTimeoutTuples_' + id + '_txtPort').val('0');
                    $('#flowAgingTimeoutTuples_' + id + '_txtPort').attr('disabled','disabled');
                } else if($('#flowAgingTimeoutTuples_' + id + '_txtPort').attr('disabled')){
                    $('#flowAgingTimeoutTuples_' + id + '_txtPort').val('');
                    $('#flowAgingTimeoutTuples_' + id + '_txtPort').removeAttr('disabled');
                }
        }
    });
    var flowProtoList = [];
    var tmpFlowProtoList = $.extend(true, [], protocolList);
    var protoCnt = tmpFlowProtoList.length;
    for (var i = 0; i < protoCnt; i++) {
        var protocol = tmpFlowProtoList[i]['name'].toUpperCase();
        if (protocol === 'TCP') {
            flowProtoList.push(
                {
                    'index': 0,
                    'text': 6 + ' (' + protocol + ')',
                    'value': protocol.toLowerCase()
                }
            );
        } else if(protocol === 'UDP') {
            flowProtoList.push(
                {
                    'index': 1,
                    'text': 17 + ' (' + protocol + ')',
                    'value': protocol.toLowerCase()
                }
            );
        } else if(protocol === 'ICMP'){
            flowProtoList.push(
                {
                    'index': 2,
                    'text': 1 + ' (' + protocol + ')',
                    'value': protocol.toLowerCase()
                }
            );
        }
    }
    //sort protocols by TCP, UDP and ICMP order
    flowProtoList.sort(function(a, b){
        return (a.index - b.index) || a.text.localeCompare(b.text);
    });
    var comboProtocol = $(protocolDiv).data("contrailCombobox");
    var actProtocol = null;
    if(comboProtocol) {
        var actProtocol = getValueByJsonPath(flowAgingTimeout, 'protocol', '').toLowerCase();
        comboProtocol.setData(flowProtoList);
        comboProtocol.value(actProtocol);
    }
    $(inputTxtPort).val(getValueByJsonPath(flowAgingTimeout, 'port', ''));
    if(actProtocol === 'icmp' || actProtocol === '1') {
        $(inputTxtPort).attr('disabled', 'disabled');
    }
    $(inputTxtTimeout).val(getValueByJsonPath(flowAgingTimeout, 'timeout_in_seconds', ''));
    return rootDiv;
}

function validateFlowAgingTimeoutEntry() {
    var len = $("#flowAgingTimeoutTuples").children().length;
    if(len > 0) {
        for(var i=0; i<len; i++) {
            var id = getID(String($("#flowAgingTimeoutTuples").children()[i].id));
            var protocol = $("#flowAgingTimeoutTuples_" + id + '_comboProtocol').data('contrailCombobox').value();
            if(protocol == null || protocol.trim() === '' ||
                $.inArray(protocol, ['tcp','udp','icmp']) === -1 &&
                isNaN(protocol) || parseInt(protocol) < 0 || parseInt(protocol) > 255) {
                showInfoWindow("Select a protocol or enter a code between 0 - 255", "Invalid input in Protocol") ;
                return false;
            }
            var port = $("#flowAgingTimeoutTuples_" + id + '_txtPort').val();
            if (port != '' && port != null && (isNaN(port) || parseInt(port) < 0 || parseInt(port) > 65535)) {
                showInfoWindow("Enter a valid port between 0 - 65535", "Invalid input in Port");
                return false;
            }
            var timeout = $("#flowAgingTimeoutTuples_" + id + '_txtTimeout').val();
            if (timeout != '' && timeout != null && isNaN(timeout)) {
                showInfoWindow("Timeout should be a number", "Invalid input in Timeout");
                return false;
            }
        }
    }
    return true;
}

/*end  flow aging timeout section*/

function clearSubnetEntries() {
    var tuples = $("#subnetTuples")[0].children;
    if (tuples && tuples.length > 0) {
        var tupleLength = tuples.length;
        for (var i = 0; i < tupleLength; i++) {
            $(tuples[i]).empty();
        }
        $(tuples).empty();
        $("#subnetTuples").empty();
    }
}

function validate() {
    var vxlanid = $('input:radio[name=vxlanMode]:checked').val();
    var priorities = [];
    var epTuples = $("#epTuples")[0].children;
    var flowExportRate = $("#txtFlowExportRate").val();
    if(null !== flowExportRate && typeof flowExportRate === "string" &&
        isNumber(flowExportRate.trim()) === false) {
        showInfoWindow("Flow Export Rate should be numeric.", "Invalid Input");
        return false;
    }

    if (epTuples && epTuples.length > 0) {
    	var encapsulationLabels = ["MPLS Over GRE","MPLS Over UDP","VxLAN"];
    	var encapsulationValues = ["MPLSoGRE","MPLSoUDP","VXLAN"];

    	for (var i = 0; i < epTuples.length; i++) {
            var epTuple = $($($(epTuples[i]).find("div")[0]).find("div")[0]);
            var priority = $($(epTuple).find("div.span12")[1]).data("contrailDropdown").text();
            if(encapsulationLabels.indexOf(priority) !== -1) {
            	priorities.push(encapsulationValues[encapsulationLabels.indexOf(priority)]);	
            }
    	}
        var unique=priorities.filter(function(itm,i,a){
            return i==priorities.indexOf(itm);
        });
        if(priorities.length != unique.length){
            showInfoWindow("Encapsulation cannot be same.", "Input Required");
            return false;
        }
        if(validateSubnetEntry() === false) {
            return false;
        }
        if(validateFlowAgingTimeoutEntry() === false) {
            return false;
        }
    }
    if(vxlanid === "configured" && priorities.indexOf("VXLAN") === -1) {
    	showInfoWindow("Encapsulation type 'VxLAN' is required while setting VxLAN identifier mode.", "Input Required");
    	return false;
    }
	return true;
}

function destroy() {
    clearEPEntries();
    clearFlowAgingTimeoutEntries();
    btnSaveFwdOptions = $("#btnSaveFwdOptions");
    if(isSet(btnSaveFwdOptions)) {
        btnSaveFwdOptions.remove();
        btnSaveFwdOptions = $();
    }

    btnCnfSaveCancel = $("#btnCnfSaveCancel");
    if(isSet(btnCnfSaveCancel)) {
        btnCnfSaveCancel.remove();
        btnCnfSaveCancel = $();
    }

    btnCnfSaveOK = $("#btnCnfSaveOK");
    if(isSet(btnCnfSaveOK)) {
        btnCnfSaveOK.remove();
        btnCnfSaveOK = $();
    }

    confirmMainSave = $("#confirmMainSave");
    if(isSet(confirmMainSave)) {
        confirmMainSave.remove();
        confirmMainSave = $();
    }

    var fwdOptionsTemplate = $("#fwdoptions-config-template");
    if(isSet(fwdOptionsTemplate)) {
        fwdOptionsTemplate.remove();
        fwdOptionsTemplate = $();
    }
}