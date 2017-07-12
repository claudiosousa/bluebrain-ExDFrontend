/**---LICENSE-BEGIN - DO NOT CHANGE OR MOVE THIS HEADER
 * This file is part of the Neurorobotics Platform software
 * Copyright (C) 2014,2015,2016,2017 Human Brain Project
 * https://www.humanbrainproject.eu
 *
 * The Human Brain Project is a European Commission funded project
 * in the frame of the Horizon2020 FET Flagship plan.
 * http://ec.europa.eu/programmes/horizon2020/en/h2020-section/fet-flagships
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 * ---LICENSE-END**/

// This file is currently used for testing purpose. It embeds a description brain file
// in the BRAIN3D namespace. The description file is defined using annotations, colors
// and an array of poses which includes xyz coordinates.

BRAIN3D.embeddedData = {};

BRAIN3D.embeddedData["allannames"] = BRAIN3D.allannames;
BRAIN3D.embeddedData["allancolors"] = BRAIN3D.allancolors;
BRAIN3D.embeddedData["poses"] = [BRAIN3D.poses_1,BRAIN3D.poses_2,BRAIN3D.poses_3,BRAIN3D.poses_4];



