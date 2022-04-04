(function() {
    let template = document.createElement("template");
    var gPassedServiceType; // holds passed in guarantee of service - set in onCustomWidgetBeforeUpdate()
    var gPassedPortalURL; //ESRI Portal URL
    var gPassedAPIkey; //ESRI JS api key
    var gWebmapInstantiated = 0; // a global used in applying definition query
    var gMyLyr; // for sublayer
    var gMyWebmap; // needs to be global for async call to onCustomWidgetAfterUpdate()

    template.innerHTML = `
        <link rel="stylesheet" href="https://js.arcgis.com/4.18/esri/themes/light/main.css">
        <style>
        #mapview {
            width: 100%;
            height: 100%;
        }
        #timeSlider {
            position: absolute;
            left: 5%;
            right: 15%;
            bottom: 20px;
        }
        </style>
        <div id='mapview'></div>
        <div id='timeSlider'></div>
    `;
    
    // this function takes the passed in servicelevel and issues a definition query
    // to filter service location geometries
    //
    // A definition query filters what was first retrieved from the SPL feature service
    

    // process the definition query on the passed in SPL feature sublayer
   

    class Map extends HTMLElement {
        constructor() {
            super();
            
            //this._shadowRoot = this.attachShadow({mode: "open"});
            this.appendChild(template.content.cloneNode(true));
            this._props = {};
            let that = this;

            require(["esri/Map", "esri/views/MapView", "esri/layers/MapImageLayer"], (Map, MapView, MapImageLayer) => {
        /*
                // set portal and API Key
                esriConfig.portalUrl = gPassedPortalURL

                //  set esri api Key 
                esriConfig.apiKey = gPassedAPIkey
        
                // set routing service
                var routeTask = new RouteTask({
                    url: "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World"
                });
                */
                
                //new code
                
                const renderer = {
          type: "simple", // autocasts as new SimpleRenderer()
          symbol: {
            type: "simple-line", // autocasts as new SimpleLineSymbol()
            color: [255, 255, 255, 0.5],
            width: 0.75,
            style: "long-dash-dot-dot"
          }
        };
                
                const layer = new MapImageLayer({
          url: "https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer",
          sublayers: [
            {
              id: 2,
              visible: true
            },
            {
              id: 4,
              visible: false,
              title: "Railroads",
              renderer: renderer,
              source: {
                // indicates the source of the sublayer is a dynamic data layer
                type: "data-layer",
                // this object defines the data source of the layer
                // in this case it's a feature class table from a file geodatabase
                dataSource: {
                  type: "table",
                  // workspace name
                  workspaceId: "MyDatabaseWorkspaceIDSSR2",
                  // table name
                  dataSourceName: "ss6.gdb.Railroads"
                }
              }
            },
            {
              id: 1,
              visible: true
            },
            {
              id: 0,
              visible: true
            }
          ]
        });
                
                
            const map = new Map({
          basemap: "dark-gray-vector",
          layers: [layer]
        });

        const view = new MapView({
          container: "viewDiv",
          map: map,
          zoom: 3,
          center: [-99, 39]
        });

        /*****************************************************************
         * Wait for Layer to load and update the page to refelect which
         * layers are visible in the Map Service.
         *****************************************************************/
        layer.when(() => {
          layer.sublayers.map((sublayer) => {
            const id = sublayer.id;
            const visible = sublayer.visible;
            const node = document.querySelector(".sublayers-item[data-id='" + id + "']");
            if (visible) {
              node.classList.add("visible-layer");
            }
          });
        });

        /*****************************************************************
         * Listen for when buttons on the page have been clicked to turn
         * layers on and off in the Map Service.
         *****************************************************************/
        const sublayersElement = document.querySelector(".sublayers");
        sublayersElement.addEventListener("change", (event) => {
          const id = event.target.getAttribute("gPassedServiceType");
          if (id) {
            const sublayer = layer.findSublayerById(parseInt(id));
            const node = document.querySelector(".sublayers-item[gPassedServiceType='"+id+"']");
            sublayer.visible = !sublayer.visible;
            node.classList.toggle("visible-layer");
          }
      
      });
                
                
                
        

            }); // end of require()
        } // end of constructor()    

        getSelection() {
            return this._currentSelection;
        }

        

        onCustomWidgetAfterUpdate(changedProperties) 
        {
            if ("servicelevel" in changedProperties) {
                this.$servicelevel = changedProperties["servicelevel"];
            }
            gPassedServiceType = this.$servicelevel; // place passed in value into global

       

  
        }
    } // end of class

    let scriptSrc = "https://js.arcgis.com/4.18/";
    let onScriptLoaded = function() {
        customElements.define("com-sap-custom-geomap", Map);
    };

    //SHARED FUNCTION: reuse between widgets
    //function(src, callback) {
    let customElementScripts = window.sessionStorage.getItem("customElementScripts") || [];
    let scriptStatus = customElementScripts.find(function(element) {
        return element.src == scriptSrc;
    });

    if (scriptStatus) {
        if(scriptStatus.status == "ready") {
            onScriptLoaded();
        } else {
            scriptStatus.callbacks.push(onScriptLoaded);
        }
    } else {
        let scriptObject = {
            "src": scriptSrc,
            "status": "loading",
            "callbacks": [onScriptLoaded]
        }
        customElementScripts.push(scriptObject);
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = scriptSrc;
        script.onload = function(){
            scriptObject.status = "ready";
            scriptObject.callbacks.forEach((callbackFn) => callbackFn.call());
        };
        document.head.appendChild(script);
    }

//END SHARED FUNCTION
})(); // end of class
