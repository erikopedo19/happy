import React from "react";
import Services from "@/pages/Services";
import { useState } from "react";


// this ount appoinments and keep on user state the name of the service 
interface AppointmentsCounterProps {
    servicesname: string;
    setCount:number;
}

const AppointmentsCounter: React.FC<AppointmentsCounterProps> = () => {
    const [count, setCount] = useState(0);

    const incrementCount = () => setCount(count + 1);
     
    return (
        <div>
            <Services/>
        </div>
    );
};

export default AppointmentsCounter;
