import React from 'react';
import EnterpriseView from '../components/EnterpriseView';

const OfficeAdmin = (props) => {
  return <EnterpriseView moduleId="office_admin" {...props} />;
};

export default React.memo(OfficeAdmin);
