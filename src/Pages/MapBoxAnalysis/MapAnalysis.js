import React from 'react';
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import { Component } from 'react';
import { axiosInstance } from '../../utils/axiosIntercepter';
import { Spin } from 'antd';
import './MapAnalysis.css';
mapboxgl.accessToken =
  'pk.eyJ1IjoieXV2cmFqMW1hbm4iLCJhIjoiY2tvajBjNDVzMDloNjJwcHY3dmVrdjRpaCJ9.pSm8WmmX7RDUc-S45ESMtw';

class MapAnalysis extends Component {
  constructor(props) {
    super(props);
    this.state = {
      lng: 77.216721,
      lat: 28.6448,
      zoom: 6,
      locations: null,
      loading: false,
    };
    this.mapContainer = React.createRef();
  }
  fetchLocations = async () => {
    const { lng, lat, zoom, locations } = this.state;
    this.setState({
      ...this.state,
      loading: true,
    });
    try {
      let locs = await axiosInstance.get(
        'https://api.aflmonitoring.com/api/upload/locations/map/',
      );

      let features = locs.data.map((location, idx) => {
        return {
          type: 'Feature',
          properties: {
            id: location.id,
            village_name: location.village_name,
          },
          geometry: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude],
          },
        };
      });

      let geoData = {
        type: 'FeatureCollection',
        crs: {
          type: 'name',
          properties: {
            name: 'urn:ogc:def:crs:OGC:1.3:CRS84',
          },
        },
        features: features,
      };
      const map = new mapboxgl.Map({
        container: this.mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',

        center: [lng, lat],
        zoom: zoom,
      });
      map.on('move', () => {
        this.setState({
          lng: map.getCenter().lng.toFixed(4),
          lat: map.getCenter().lat.toFixed(4),
          zoom: map.getZoom().toFixed(2),
        });
      });
      map.on('load', function () {
        map.addSource('earthquakes', {
          type: 'geojson',
          data: geoData,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        });

        map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'earthquakes',
          filter: ['has', 'point_count'],
          paint: {
            // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
            // with three steps to implement three types of circles:
            //   * Blue, 20px circles when point count is less than 100
            //   * Yellow, 30px circles when point count is between 100 and 750
            //   * Pink, 40px circles when point count is greater than or equal to 750
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#51bbd6',
              100,
              '#f1f075',
              750,
              '#f28cb1',
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              20,
              100,
              30,
              750,
              40,
            ],
          },
        });

        map.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'earthquakes',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12,
          },
        });

        map.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: 'earthquakes',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': '#11b4da',
            'circle-radius': 4,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff',
          },
        });

        // inspect a cluster on click
        map.on('click', 'clusters', function (e) {
          var features = map.queryRenderedFeatures(e.point, {
            layers: ['clusters'],
          });
          var clusterId = features[0].properties.cluster_id;
          map
            .getSource('earthquakes')
            .getClusterExpansionZoom(clusterId, function (err, zoom) {
              if (err) return;

              map.easeTo({
                center: features[0].geometry.coordinates,
                zoom: zoom,
              });
            });
        });

        map.on('click', 'unclustered-point', function (e) {
          var coordinates = e.features[0].geometry.coordinates.slice();
          var mag = e.features[0].properties.mag;
          var village_name = e.features[0].properties.village_name;

          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML('<br>' + village_name)
            .addTo(map);
        });

        map.on('mouseenter', 'clusters', function () {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'clusters', function () {
          map.getCanvas().style.cursor = '';
        });
      });
      this.setState({
        ...this.state,
        locations: geoData,
        loading: false,
      });
      console.log(features);
    } catch (e) {
      console.log(e);
      this.setState({
        ...this.state,
        loading: false,
      });
    }
  };
  componentDidMount() {
    this.fetchLocations();
  }
  render() {
    const { lng, lat, zoom } = this.state;
    return (
      <Spin spinning={this.state.loading}>
        <div className="map-wrapper">
          <div className="sidebar">
            Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
          </div>
          <div ref={this.mapContainer} className="map-container" />
        </div>
      </Spin>
    );
  }
}

export default MapAnalysis;
