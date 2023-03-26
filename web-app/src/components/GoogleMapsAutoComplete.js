import React, {useState, useEffect, useMemo} from 'react';
import TextField from '@mui/material/TextField';
import { Autocomplete } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { makeStyles } from '@mui/styles';
import parse from 'autosuggest-highlight/parse';
import throttle from 'lodash/throttle';
import { geocodeByPlaceId } from 'react-places-autocomplete';
import { useTranslation } from "react-i18next";
import { useSelector} from "react-redux";
import Box from '@mui/material/Box';

const autocompleteService = { current: null };

const useStyles = makeStyles((theme) => ({
  icon: {
    color: theme.palette.text.secondary,
    marginRight: theme.spacing(2),
  },
  iconRtl: {
    color: theme.palette.text.secondary,
    marginLeft: theme.spacing(2),
  },
  inputRtl: {
    "& label": {
      right: 75,
      left: "auto"
    },
    "& legend": {
      textAlign: "right",
      marginRight:60
    }
  }
}));

export default function GoogleMapsAutoComplete(props) {
  const classes = useStyles();
  const [value, setValue] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState([]);
  const { t } = useTranslation();
  const { i18n  } = useTranslation();
  const isRTL = i18n.dir();
  const settingsdata = useSelector(state => state.settingsdata);
  const [settings,setSettings] = useState({});

  useEffect(()=>{
    if(settingsdata.settings){
      setSettings(settingsdata.settings);
    }
  },[settingsdata.settings]);

  const fetch = useMemo(
    () =>
      throttle((request, callback) => {
        autocompleteService.current.getPlacePredictions(request, callback);
      }, 200),
    [],
  );

  useEffect(() => {
    let active = true;

    if (!autocompleteService.current && window.google) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
    }
    if (!autocompleteService.current) {
      return undefined;
    }

    if (inputValue === '') {
      setOptions(value ? [value] : []);
      return undefined;
    }

    fetch({ input: inputValue , componentRestrictions: {country:`${settings.restrictCountry}`}}, (results) => {
      if (active) {
        let newOptions = [];

        if (value) {
          newOptions = [value];
        }

        if (results) {
          newOptions = [...newOptions, ...results];
        }

        setOptions(newOptions);
      }
    });

    return () => {
      active = false;
    };
  }, [value, inputValue, fetch, settings.restrictCountry]);

  return (
    <Autocomplete
      style={props.style}
      getOptionLabel={(option) => (typeof option === 'string' ? option : option.description)}
      filterOptions={(x) => x}
      options={options}
      autoComplete
      includeInputInList
      filterSelectedOptions
      value={props.value}
      onChange={(event, newValue) => {
        setOptions(newValue ? [newValue, ...options] : options);
        setValue(newValue);
        if (newValue && newValue.place_id) {
          geocodeByPlaceId(newValue.place_id)
            .then(results => {
              if (results.length > 0) {
                newValue.coords = { lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng() }
                newValue.placeDetails = results[0];
              }
              props.onChange(newValue);
            })
            .catch(error => alert(t('google_places_error')));
        } else {
          props.onChange(newValue);
        }
      }}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={props.placeholder}
          variant={props.variant}
          className={isRTL==='rtl'? classes.inputRtl:classes.commonInputStyle}
          fullWidth
        />
      )}

      renderOption={(props, option) => {
        const matches =
          option.structured_formatting.main_text_matched_substrings || [];

        const parts = parse(
          option.structured_formatting.main_text,
          matches.map((match) => [match.offset, match.offset + match.length]),
        );

        return (
          <li {...props}>
            <Grid container alignItems="center">
              <Grid item sx={{ display: 'flex', width: 44 }}>
                <LocationOnIcon sx={{ color: 'text.secondary' }} />
              </Grid>
              <Grid item sx={{ width: 'calc(100% - 44px)', wordWrap: 'break-word' }}>
                {parts.map((part, index) => (
                  <Box
                    key={index}
                    component="span"
                    sx={{ fontWeight: part.highlight ? 'bold' : 'regular' }}
                  >
                    {part.text}
                  </Box>
                ))}

                <Typography variant="body2" color="text.secondary">
                  {option.structured_formatting.secondary_text}
                </Typography>
              </Grid>
            </Grid>
          </li>
        );
      }}
      // renderOption={(props,option) => {
      //   const matches = option.structured_formatting.main_text_matched_substrings;
      //   const parts = parse(
      //     option.structured_formatting.main_text,
      //     matches.map((match) => [match.offset, match.offset + match.length]),
      //   );
      //   return (
      //     <Grid key={option.place_id} container alignItems="center" style={{direction:isRTL==='rtl'?'rtl':'ltr'}}>
      //       <Grid item>
      //         <LocationOnIcon className={isRTL==='rtl'? classes.iconRtl:classes.icon} />
      //       </Grid>
      //       <Grid item xs style={{textAlign:isRTL==='rtl'?'right':'left'}}>
      //         {parts.map((part, index) => (
      //           <span key={index} style={{ fontWeight: part.highlight ? 700 : 400}}>
      //             {part.text}
      //           </span>
      //         ))}

      //         <Typography variant="body2" color="textSecondary">
      //           {option.structured_formatting.secondary_text}
      //         </Typography>
      //       </Grid>
      //     </Grid>
      //   );
      // }}
    />
  );
}