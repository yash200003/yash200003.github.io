(function () {
    let template = document.createElement("template");
    var gPassedServiceType; // holds passed in guarantee of service - set in onCustomWidgetBeforeUpdate()
    var gPassedPortalURL; //ESRI Portal URL
    var gPassedAPIkey; //ESRI JS api key
    var gWebmapInstantiated = 0; // a global used in applying definition query
    var gMyLyr; // for sublayer
    var gMyWebmap; // needs to be global for async call to onCustomWidgetAfterUpdate()

    template.innerHTML = `
    <title>
      Edit features with the Editor widget | Sample | ArcGIS API for JavaScript
      4.23
    </title>

    <link
      rel="stylesheet"
      href="https://js.arcgis.com/4.23/esri/themes/light/main.css"
    />
    <script src="https://js.arcgis.com/4.23/"></script>

    <style>
      html,
      body,
      #viewDiv {
        padding: 0;
        margin: 0;
        height: 100%;
        width: 100%;
      }

      .esri-editor .esri-item-list__scroller {
        max-height: 350px;
      }
    </style>
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
            
            //start of required
            require(["esri/layers/FeatureLayer", "esri/WebScene", "esri/views/SceneView", "esri/widgets/Editor"], (
		FeatureLayer,
		WebScene,
		SceneView,
		Editor
	) =>
	{
		// Create a map from the referenced webscene item id
		const webscene = new WebScene(
		{
			portalItem:
			{
				id: "206a6a13162c4d9a95ea6a87abad2437"
			}
		});

		// Create a layer with visualVariables to use interactive handles for size and rotation
		const recreationLayer = new FeatureLayer(
		{
			title: "Recreation",
			url: "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/EditableFeatures3D/FeatureServer/1",
			elevationInfo:
			{
				mode: "absolute-height"
			},
			renderer:
			{
				type: "unique-value", // autocasts as new UniqueValueRenderer()
				field: "TYPE",
				visualVariables: [
				{
					// size can be modified with the interactive handle
					type: "size",
					field: "SIZE",
					axis: "height",
					valueUnit: "meters"
				},
				{
					// rotation can be modified with the interactive handle
					type: "rotation",
					field: "ROTATION"
				}],
				uniqueValueInfos: [
				{
					value: "1",
					label: "Slide",
					symbol:
					{
						type: "point-3d", // autocasts as new PointSymbol3D()
						symbolLayers: [
						{
							type: "object",
							resource:
							{
								href: "https://static.arcgis.com/arcgis/styleItems/Recreation/gltf/resource/Slide.glb"
							}
						}],
						styleOrigin:
						{
							styleName: "EsriRecreationStyle",
							name: "Slide"
						}
					}
				},
				{
					value: "2",
					label: "Swing",
					symbol:
					{
						type: "point-3d", // autocasts as new PointSymbol3D()
						symbolLayers: [
						{
							type: "object",
							resource:
							{
								href: "https://static.arcgis.com/arcgis/styleItems/Recreation/gltf/resource/Swing.glb"
							}
						}],
						styleOrigin:
						{
							styleName: "EsriRecreationStyle",
							name: "Swing"
						}
					}
				}]
			}
		});

		webscene.add(recreationLayer);

		const view = new SceneView(
		{
			container: "viewDiv",
			qualityProfile: "high",
			map: webscene
		});

		view.when(() =>
		{
			view.popup.autoOpenEnabled = false; //disable popups
			// Create the Editor
			const editor = new Editor(
			{
				view: view
			});
			// Add widget to top-right of the view
			view.ui.add(editor, "top-right");
		});
	});
            
            
            //end of required
        } // end of constructor()

        getSelection() {
            return this._currentSelection;
        }

        onCustomWidgetAfterUpdate(changedProperties) {
            if ("servicelevel" in changedProperties) {
                this.$servicelevel = changedProperties["servicelevel"];
                gPassedServiceType = this.$servicelevel; // place passed in value into global
                console.log(gPassedServiceType);
/*
                const sublayer = layer.findSublayerById(parseInt(gPassedServiceType));
                const node = document.querySelector(".sublayers-item[data-id='" + gPassedServiceType + "']");
                sublayer.visible = !sublayer.visible;
                node.classList.toggle("visible-layer"); */
            }
            gPassedServiceType = this.$servicelevel; // place passed in value into global
        }
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
