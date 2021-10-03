/*
Approach:
1. Parsing of each response data and created common array of objects.
2. structure of object is : {Id:rowId, data=[{key:uniquekey,value:value of attribute}...]}
3. Created common header object array that can be merged with other response data.
4. lineItemDataHeaders- this will be configured manually, as the headers of line data need to be specified.
*/
import { LightningElement,track } from 'lwc';
import {getSummaryYears,getSummaryMonths,getLineItemData} from './responseFile.js';

export default class ShowUserIdData extends LightningElement {
    monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
    lineItemDataHeaders = {
        productItemName: 'Product',
        optionItemName: 'Option',
        attributesWithValues: 'Attribute',
        revenueType: 'Revenue Type',
        displayQty: 'QTY',
        displayUnitPrice: 'Unit Price',
        startMonth: 'Start Month',
        months: 'Months',
        revenueRecognitionName: 'Revenue Recognition',
        months: 'Commited'

    }
    yearHeaders =[];
    lineItemDataYears = [];

    monthList =[];
    lineItemDataMonths = [];
    rowIds = [];
    displayTable = false;
    @track lineItemArray;
    @track header;
    @track listValues;
    lineitemheader;
    monthHeader;
    summaryYears;
    summaryMonths;
    lineItemData;

    connectedCallback(){
        this.lineItemArray = [];
        this.lineitemheader = [];
        this.header = [];
        //getting response from the response js file.
        this.summaryYears = getSummaryYears();
        this.summaryMonths = getSummaryMonths();
        this.lineItemData = getLineItemData();   
        debugger;
        this.listValues = [];

        //line item header creation.
        for (let property in this.lineItemDataHeaders) {
            this.lineitemheader.push({Id:`${property}`,data: `${this.lineItemDataHeaders[property]}`});
            
        }

        //array of line item data
        this.lineItemData.forEach((itemRow, index) => {
            let newRow = []
            for (let property in this.lineItemDataHeaders) {
                newRow.push( {
                    value: itemRow[property]?itemRow[property]:'N/A',
                    key: `${index}${property}${itemRow.productItemId}`
                });
            }
            this.lineItemArray.push({ Id: itemRow.productFLIId, data: newRow });
            this.rowIds.push(itemRow.productFLIId);
            
        })
        console.log(this.lineItemArray);
            
        


        
        //empty data for summary row.
        let tempArray = [];
        for(let i =0; i< this.lineitemheader.length;i++){
            tempArray.push({
                value: '',
                key: i*i
            });
        }
        this.lineItemArray.push({ Id: 'summary', data: tempArray });
        console.log('items: '+this.lineItemArray);
        var summaryRow = [];

        //arrya of years data.
        this.summaryYears.responseData.yearsData.forEach((itemRow, index)=>{
            let allIds = [...this.rowIds]
            this.yearHeaders.push({Id: index+itemRow.year, data:itemRow.year});
            summaryRow.push({
                value: itemRow.summaryAmount,
                key: `${index}${itemRow.year}`
            })
            itemRow.lineData.forEach((yearRow)=>{
                let index = allIds.indexOf(yearRow.recordId);
                if (index > -1) {
                    allIds.splice(index, 1);
                }
                let arr = [];
                let obj = this.lineItemDataYears.find(o => o.Id === yearRow.recordId);
                
                if( obj ){
                    arr = arr.concat(obj.data);
                    arr.push({
                        value: yearRow.amount,
                        key: `${index}${itemRow.year}`  
                    });
                    
                } else {
                    arr.push({
                        value: yearRow.amount,
                        key: `${index}${itemRow.year}`
                    })

                }
                let objIndex = this.lineItemDataYears.findIndex((obj => obj.Id === yearRow.recordId));
                if(objIndex > -1)
                    this.lineItemDataYears[objIndex].data = arr;
                else
                    this.lineItemDataYears.push({ Id: yearRow.recordId, data: arr });
            })
            //maintaining empty spaces with a - value.
            if(allIds.length > 0){
                allIds.forEach((recId)=>{
                    let objIndex = this.lineItemDataYears.findIndex((obj => obj.Id === recId));
                    let data = [...this.lineItemDataYears[objIndex].data];
                    data.push({
                        value: '-',
                        key: `${index}${itemRow.year}`
                    })
                    this.lineItemDataYears[objIndex].data = data;

                })
                
            }
        });
        this.lineItemDataYears.push({ Id: 'summary', data: summaryRow });
        console.log('years: '+this.lineItemDataYears);
 


        //month data array.
        this.monthHeader = [];
        let startMonth = this.summaryMonths.responseData.startMonth;
        let totalMonths = this.summaryMonths.responseData.summaryAmount.length;
        let startYear = this.summaryMonths.responseData.startYear;
        let year = startYear;
        for(let i = startMonth; i< startMonth+totalMonths; i++ ){
            let month = this.monthNames[i%12];
            year = i%12 === 0 ? year + 1 : year;
            this.monthList.push( ''+month+' '+year);
            this.monthHeader.push({Id:i+month+year,data: month+' '+year})
        }
        var summaryRow = [];
        this.summaryMonths.responseData.summaryAmount.forEach((itemRow, index)=>{
            summaryRow.push({
                value: itemRow,
                key: `${index}${itemRow}`
            })
        })
        this.summaryMonths.responseData.linesData.forEach((itemRow, index)=>{
            let arr = [];
            let tempEmptySpace = itemRow.startMonth - startMonth;
            let tempCount = -1;
            for(let i = 0; i < tempEmptySpace; i++ ){
                tempCount = tempCount +1;
                arr.push({
                    value: '-',
                    key: `${index}${itemRow.startMonth}${itemRow.startYear}`
                })
            }
            for(let j = 0; j< itemRow.data.length; j++){
                tempCount = tempCount +1;
                arr.push({
                    value: `${itemRow.data[j]}`,
                    key: `${index}${itemRow.startMonth}${itemRow.startYear}`
                })
            }
            for(let k = tempEmptySpace + itemRow.data.length; k< totalMonths; k++){
                tempCount = tempCount +1;
                arr.push({
                    value: '-',
                    key: `${index}${itemRow.startMonth}${itemRow.startYear}`
                })
            }
            this.lineItemDataMonths.push({Id: itemRow.recordId, data: arr});
            this.lineItemDataMonths.push({Id: 'summary', data: summaryRow});
            
        })
        
        console.log(this.lineItemDataMonths);
        this.header = this.lineitemheader.concat(this.monthHeader);
        this.listValues =[...this.concatListData(this.lineItemArray,this.lineItemDataMonths)];
        this.displayTable = true;
    }

    // method to merge our custom array of object.
    concatListData(list1, list2){
        let concatedList = [];
        list1.forEach(item => {
            let arr = [];
            let list1Index = list1.findIndex((obj => obj.Id === item.Id));
            let list2Index = list2.findIndex((obj => obj.Id === item.Id));

            arr = arr.concat(list1[list1Index].data);
            arr = arr.concat(list2[list2Index].data);
            concatedList.push({Id:item.Id, data : arr})
            //list1[list1Index].data = arr;
        })
        return concatedList;
        
    }

    //picklist value change handler.
    changeHandler(event) {
        let plValue = event.target.value;
        if (plValue === 'monthly') {
            this.header = this.lineitemheader.concat(this.monthHeader);
            this.listValues =[...this.concatListData(this.lineItemArray,this.lineItemDataMonths)];
        } else {
            this.header = this.lineitemheader.concat(this.yearHeaders);
            this.listValues =[...this.concatListData(this.lineItemArray,this.lineItemDataYears)];
        }
    }
};