(function () {
    let template = document.createElement("template");
    var gPassedServiceType; // holds passed in guarantee of service - set in onCustomWidgetBeforeUpdate()
    var gPassedPortalURL; //ESRI Portal URL
    var gPassedAPIkey; //ESRI JS api key
    var gWebmapInstantiated = 0; // a global used in applying definition query
    var gMyLyr; // for sublayer
    var gMyWebmap; // needs to be global for async call to onCustomWidgetAfterUpdate()

    template.innerHTML = `
        <link rel="stylesheet" href="https://js.arcgis.com/4.23/esri/themes/dark/main.css" />
        <script src="https://js.arcgis.com/4.23/"></script>
        <style>
  html, body, #viewDiv {
    height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
  }
  #infoDiv {
    padding: 10px;
    width: 275px;
  }
  #sliderValue{
    font-weight: bolder;
  }
  #legendDiv{
    width: 260px;
  }
  #description{
    padding: 10px 0 10px 0;
  }
</style><body>
  <div id="viewDiv"></div>
  <div id="infoDiv" class="esri-widget">
    <div id="description">
      Show power plants with at least <span id="sliderValue">0</span> megawatts of capacity
    </div>
    <div id="sliderContainer">
      <div id="sliderDiv"></div>
    </div>
    <div id="legendDiv"></div>
  </div>
</body>
<body>
  <div id="viewDiv"></div>
  <div id="infoDiv" class="esri-widget">
    <div id="description">
      Show power plants with at least <span id="sliderValue">0</span> megawatts of capacity
    </div>
    <div id="sliderContainer">
      <div id="sliderDiv"></div>
    </div>
    <div id="legendDiv"></div>
  </div>
</body>
        
    `;

    // this function takes the passed in servicelevel and issues a definition query
    // to filter service location geometries
    //
    // A definition query filters what was first retrieved from the SPL feature service

    class Map extends HTMLElement {
        constructor() {
            super();

            //this._shadowRoot = this.attachShadow({mode: "open"});
            this.appendChild(template.content.cloneNode(true));
            this._props = {};
            let that = this;

            require(["esri/Map", "esri/views/MapView", "esri/layers/FeatureLayer", "esri/widgets/Legend", "esri/widgets/Slider", "esri/widgets/Expand"], (Map, MapView, FeatureLayer, Legend, Slider, Expand) => {
                // Configure clustering on the layer with a
                // popupTemplate displaying the predominant
                // fuel type of the power plants in the cluster

                const clusterLabelThreshold = 1500;

                const haloColor = "#373837";
                const color = "#f0f0f0";

                const clusterConfig = {
                    type: "cluster",
                    popupTemplate: {
                        title: "Cluster summary",
                        content: [
                            {
                                type: "text",
                                text: `
            This cluster represents <b>{cluster_count}</b> power plants with an average capacity of <b>{cluster_avg_capacity_mw} megawatts</b>.
             The power plants in this cluster produce a total of <b>{expression/total-mw} megawatts</b> of power.`,
                            },
                            {
                                type: "text",
                                text: "Most power plants in this cluster generate power from <b>{cluster_type_fuel1}</b>.",
                            },
                        ],
                        fieldInfos: [
                            {
                                fieldName: "cluster_count",
                                format: {
                                    places: 0,
                                    digitSeparator: true,
                                },
                            },
                            {
                                fieldName: "cluster_avg_capacity_mw",
                                format: {
                                    places: 2,
                                    digitSeparator: true,
                                },
                            },
                            {
                                fieldName: "expression/total-mw",
                                format: {
                                    places: 0,
                                    digitSeparator: true,
                                },
                            },
                        ],
                        expressionInfos: [
                            {
                                name: "total-mw",
                                title: "total megawatts",
                                expression: "$feature.cluster_avg_capacity_mw * $feature.cluster_count",
                            },
                        ],
                    },
                    // larger radii look better with multiple label classes
                    // smaller radii looks better visually
                    clusterRadius: "120px",
                    labelsVisible: true,
                    labelingInfo: [
                        {
                            symbol: {
                                type: "text",
                                haloColor,
                                haloSize: "1px",
                                color,
                                font: {
                                    family: "Noto Sans",
                                    size: "11px",
                                },
                                xoffset: 0,
                                yoffset: "-15px",
                            },
                            labelPlacement: "center-center",
                            labelExpressionInfo: {
                                expression: "Text($feature.cluster_count, '#,### plants')",
                            },
                            where: `cluster_avg_capacity_mw > ${clusterLabelThreshold}`,
                        },
                        {
                            symbol: {
                                type: "text",
                                haloColor,
                                haloSize: "2px",
                                color,
                                font: {
                                    weight: "bold",
                                    family: "Noto Sans",
                                    size: "18px",
                                },
                                xoffset: 0,
                                yoffset: 0,
                            },
                            labelPlacement: "center-center",
                            labelExpressionInfo: {
                                expression: "$feature.cluster_type_fuel1",
                            },
                            where: `cluster_avg_capacity_mw > ${clusterLabelThreshold}`,
                        },
                        {
                            symbol: {
                                type: "text",
                                haloColor,
                                haloSize: "1px",
                                color,
                                font: {
                                    weight: "bold",
                                    family: "Noto Sans",
                                    size: "12px",
                                },
                                xoffset: 0,
                                yoffset: "15px",
                            },
                            deconflictionStrategy: "none",
                            labelPlacement: "center-center",
                            labelExpressionInfo: {
                                expression: `
          var value = $feature.cluster_avg_capacity_mw;
          var num = Count(Text(Round(value)));

          Decode(num,
            4, Text(value / Pow(10, 3), "##.0k"),
            5, Text(value / Pow(10, 3), "##k"),
            6, Text(value / Pow(10, 3), "##k"),
            7, Text(value / Pow(10, 6), "##.0m"),
            Text(value, "#,###")
          );
          `,
                            },
                            where: `cluster_avg_capacity_mw > ${clusterLabelThreshold}`,
                        },
                        {
                            symbol: {
                                type: "text",
                                haloColor,
                                haloSize: "1px",
                                color,
                                font: {
                                    family: "Noto Sans",
                                    size: "11px",
                                },
                                xoffset: 0,
                                yoffset: "-15px",
                            },
                            labelPlacement: "above-right",
                            labelExpressionInfo: {
                                expression: "Text($feature.cluster_count, '#,### plants')",
                            },
                            where: `cluster_avg_capacity_mw <= ${clusterLabelThreshold}`,
                        },
                        {
                            symbol: {
                                type: "text",
                                haloColor,
                                haloSize: "2px",
                                color,
                                font: {
                                    weight: "bold",
                                    family: "Noto Sans",
                                    size: "18px",
                                },
                            },
                            labelPlacement: "above-right",
                            labelExpressionInfo: {
                                expression: "$feature.cluster_type_fuel1",
                            },
                            where: `cluster_avg_capacity_mw <= ${clusterLabelThreshold}`,
                        },
                        {
                            symbol: {
                                type: "text",
                                haloColor,
                                haloSize: "1px",
                                color,
                                font: {
                                    weight: "bold",
                                    family: "Noto Sans",
                                    size: "12px",
                                },
                                xoffset: 0,
                                yoffset: 0,
                            },
                            labelPlacement: "center-center",
                            labelExpressionInfo: {
                                expression: `
          var value = $feature.cluster_avg_capacity_mw;
          var num = Count(Text(Round(value)));

          Decode(num,
            4, Text(value / Pow(10, 3), "##.0k"),
            5, Text(value / Pow(10, 3), "##k"),
            6, Text(value / Pow(10, 3), "##k"),
            7, Text(value / Pow(10, 6), "##.0m"),
            Text(value, "#,###")
          );
          `,
                            },
                            where: `cluster_avg_capacity_mw <= ${clusterLabelThreshold}`,
                        },
                    ],
                };

                const layer = new FeatureLayer({
                    portalItem: {
                        id: "eb54b44c65b846cca12914b87b315169",
                    },
                    featureReduction: clusterConfig,
                    popupEnabled: true,
                    labelsVisible: true,
                    labelingInfo: [
                        {
                            symbol: {
                                type: "text",
                                haloColor,
                                haloSize: "1px",
                                color,
                                font: {
                                    family: "Noto Sans",
                                    size: "11px",
                                },
                                xoffset: 0,
                                yoffset: "-15px",
                            },
                            labelPlacement: "center-center",
                            labelExpressionInfo: {
                                expression: "$feature.name",
                            },
                            where: `capacity_mw > ${clusterLabelThreshold}`,
                        },
                        {
                            symbol: {
                                type: "text",
                                haloColor,
                                haloSize: "2px",
                                color,
                                font: {
                                    weight: "bold",
                                    family: "Noto Sans",
                                    size: "18px",
                                },
                                xoffset: 0,
                                yoffset: 0,
                            },
                            labelPlacement: "center-center",
                            labelExpressionInfo: {
                                expression: "$feature.fuel1",
                            },
                            where: `capacity_mw > ${clusterLabelThreshold}`,
                        },
                        {
                            symbol: {
                                type: "text",
                                haloColor,
                                haloSize: "1px",
                                color,
                                font: {
                                    weight: "bold",
                                    family: "Noto Sans",
                                    size: "12px",
                                },
                                xoffset: 0,
                                yoffset: "15px",
                            },
                            labelPlacement: "center-center",
                            labelExpressionInfo: {
                                expression: `
          var value = $feature.capacity_mw;
          var num = Count(Text(Round(value)));

          Decode(num,
            4, Text(value / Pow(10, 3), "##.0k"),
            5, Text(value / Pow(10, 3), "##k"),
            6, Text(value / Pow(10, 3), "##k"),
            7, Text(value / Pow(10, 6), "##.0m"),
            Text(value, "#,###")
          );
          `,
                            },
                            where: `capacity_mw > ${clusterLabelThreshold}`,
                        },
                        {
                            symbol: {
                                type: "text",
                                haloColor,
                                haloSize: "1px",
                                color,
                                font: {
                                    family: "Noto Sans",
                                    size: "11px",
                                },
                                xoffset: 0,
                                yoffset: "-15px",
                            },
                            labelPlacement: "above-right",
                            labelExpressionInfo: {
                                expression: "$feature.name",
                            },
                            where: `capacity_mw <= ${clusterLabelThreshold}`,
                        },
                        {
                            symbol: {
                                type: "text",
                                haloColor,
                                haloSize: "2px",
                                color,
                                font: {
                                    weight: "bold",
                                    family: "Noto Sans",
                                    size: "18px",
                                },
                            },
                            labelPlacement: "above-right",
                            labelExpressionInfo: {
                                expression: "$feature.fuel1",
                            },
                            where: `capacity_mw <= ${clusterLabelThreshold}`,
                        },
                        {
                            symbol: {
                                type: "text",
                                haloColor,
                                haloSize: "1px",
                                color,
                                font: {
                                    weight: "bold",
                                    family: "Noto Sans",
                                    size: "12px",
                                },
                                xoffset: 0,
                                yoffset: 0,
                            },
                            labelPlacement: "center-center",
                            labelExpressionInfo: {
                                expression: `
          var value = $feature.capacity_mw;
          var num = Count(Text(Round(value)));

          Decode(num,
            4, Text(value / Pow(10, 3), "##.0k"),
            5, Text(value / Pow(10, 3), "##k"),
            6, Text(value / Pow(10, 3), "##k"),
            7, Text(value / Pow(10, 6), "##.0m"),
            Text(value, "#,###")
          );
          `,
                            },
                            where: `capacity_mw <= ${clusterLabelThreshold}`,
                        },
                    ],
                });

                const map = new Map({
                    basemap: {
                        portalItem: {
                            id: "8d91bd39e873417ea21673e0fee87604",
                        },
                    },
                    layers: [layer],
                });

                const view = new MapView({
                    container: "viewDiv",
                    map: map,
                    extent: {
                        spatialReference: {
                            latestWkid: 3857,
                            wkid: 102100,
                        },
                        xmin: -42087672,
                        ymin: 4108613,
                        xmax: -36095009,
                        ymax: 8340167,
                    },
                });

                layer.when().then(() => {
                    const renderer = layer.renderer.clone();
                    renderer.visualVariables = [
                        {
                            type: "size",
                            field: "capacity_mw",
                            legendOptions: {
                                title: "Capacity (MW)",
                            },
                            minSize: "24px",
                            maxSize: "100px",
                            minDataValue: 1,
                            maxDataValue: 5000,
                        },
                    ];
                    layer.renderer = renderer;
                });

                const legend = new Legend({
                    view: view,
                    container: "legendDiv",
                });

                const infoDiv = document.getElementById("infoDiv");
                view.ui.add(
                    new Expand({
                        view: view,
                        content: infoDiv,
                        expandIconClass: "esri-icon-layer-list",
                        expanded: true,
                    }),
                    "top-right"
                );

                view.whenLayerView(layer).then((layerView) => {
                    const field = "capacity_mw";

                    const slider = new Slider({
                        min: 0,
                        max: 2000,
                        values: [0],
                        container: document.getElementById("sliderDiv"),
                        visibleElements: {
                            rangeLabels: true,
                        },
                        precision: 0,
                    });

                    const sliderValue = document.getElementById("sliderValue");

                    // filter features by power plant capacity when the user
                    // drags the slider thumb. If clustering is enabled,
                    // clusters will recompute and render based on the number
                    // and type of features that satisfy the filter where clause

                    slider.on(["thumb-change", "thumb-drag"], (event) => {
                        sliderValue.innerText = event.value;
                        layerView.filter = {
                            where: field + " >= " + event.value,
                        };
                    });
                });
            });
        } // end of constructor()
    } // end of class

    let scriptSrc = "https://js.arcgis.com/4.18/";
    let onScriptLoaded = function () {
        customElements.define("com-sap-custom-geomap", Map);
    };

    //SHARED FUNCTION: reuse between widgets
    //function(src, callback) {
    let customElementScripts = window.sessionStorage.getItem("customElementScripts") || [];
    let scriptStatus = customElementScripts.find(function (element) {
        return element.src == scriptSrc;
    });

    if (scriptStatus) {
        if (scriptStatus.status == "ready") {
            onScriptLoaded();
        } else {
            scriptStatus.callbacks.push(onScriptLoaded);
        }
    } else {
        let scriptObject = {
            src: scriptSrc,
            status: "loading",
            callbacks: [onScriptLoaded],
        };
        customElementScripts.push(scriptObject);
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = scriptSrc;
        script.onload = function () {
            scriptObject.status = "ready";
            scriptObject.callbacks.forEach((callbackFn) => callbackFn.call());
        };
        document.head.appendChild(script);
    }

    //END SHARED FUNCTION
})(); // end of class
