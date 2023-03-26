import React, { useState, useEffect, useRef } from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Dialog from '@mui/material/Dialog';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

export default function ConfirmationDialogRaw(props) {
  const { onClose, value: valueProp, open, ...other } = props;
  const { t, i18n  } = useTranslation();
  const isRTL = i18n.dir();
  const [value, setValue] = useState(valueProp);
  const radioGroupRef = useRef(null);
  const options = useSelector(state => state.cancelreasondata.simple);

  useEffect(() => {
    if (!open) {
      setValue(valueProp);
    }
  }, [valueProp, open]);

  const handleCancel = () => {
    onClose();
  };

  const handleOk = () => {
    onClose(value);
  };

  const handleChange = (event) => {
    setValue(event.target.value);
  };

  return (
    <Dialog
      disableEscapeKeyDown
      maxWidth="xs"
      aria-labelledby="confirmation-dialog-title"
      open={open}
      {...other}
      onClose={(event, reason) => {
        if (reason !== 'backdropClick') {
          onClose()
        }
      }}
      style={{direction:isRTL==='rtl'? 'rtl':'ltr'}}
    >
      <DialogTitle id="confirmation-dialog-title" style={{textAlign:'center'}}>{t('select_reason')}</DialogTitle>
      <DialogContent dividers>
        <RadioGroup
          ref={radioGroupRef}
          aria-label="ringtone"
          name="ringtone"
          value={value}
          onChange={handleChange}
        >
          {options.map((option) => (
            <FormControlLabel value={option} key={option} control={<Radio style={{margin:10}}/>} label={option} style={{padding:8}}/>
          ))}
        </RadioGroup>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={handleCancel} color="primary">
          {t('cancel')}
        </Button>
        <Button onClick={handleOk} color="primary">
          {t('ok')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ConfirmationDialogRaw.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
};