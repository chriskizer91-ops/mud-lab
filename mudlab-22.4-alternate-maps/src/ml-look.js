/* =====================================================================================
   MUD LAB: ITS OWN DAYLIGHT (Mud Lab 8). Until now the day was Salt & Sand's: High noon in the desert's air (a
   thin haze, a third of the sky's light, the exposure aimed 1.8 times as bright, a quarter of the sky's clouds:
   right for white dunes, washed out over grass, woods and mud). The day here now:
   - the sun lower and a little warmer, from the west-south-west (32 degrees up: shadows half as long again as
     what casts them, so ruts, berms and the lie of the land show);
   - a deeper blue overhead, fair-weather clouds over half the sky;
   - more haze in the air (things further off are paler and bluer: the world reads as deep), the sky's own
     light all there (shade isn't black), the exposure brought down so colours keep their depth (1.3, from 1.8:
     at 1.15 the truck's black rack and tyres lost their detail, which a phone in daylight can't spare).
   None of it costs anything to draw: they are the numbers the same passes are handed. Golden hour and the full
   moon are as they were (the desert's air is still theirs). The picture's sharpening and the painting of the
   ground, the water and the trees are in src/ml-look.glsl.
   ===================================================================================== */
const ML_DAY={name:'Afternoon',sun:V3.norm([-.8,.53,.27]),sunCol:[6.5,5.7,4.6],ambUp:[.5,.58,.77],ambDn:[.25,.21,.145],skyZen:[.11,.26,.82],skyHor:[.55,.72,1.],
  fogCol:[.56,.67,.86],fogAmb:[.38,.455,.57],cloud:.5,grade:[1.17,1.02]};
Object.assign(TOD.day,ML_DAY);
/* (the air by the time of day: the day's own; golden hour's and the night's as Salt & Sand had them) */
{const SAS=DYB.air,DAY={fog:.9,amb:1,key:1.3};Object.defineProperty(DYB,'air',{get(){return (typeof APP!=='undefined'&&APP.tod&&APP.tod!=='day')?SAS:DAY;},configurable:true});}
window.__mllook={ML_DAY};
